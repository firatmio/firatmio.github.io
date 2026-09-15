import { PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import type { EffectComposer } from "postprocessing";
import { projects } from "@/content/projects";
import { CameraPath } from "./camera/CameraPath";
import { signatureFontFamily } from "./fonts";
import { DESERT, GALAXY, SAND, VIEW } from "./layout";
import { createPostProcessing } from "./postprocessing";
import { buildStates } from "./particles/states";
import { createBrainWarp } from "./particles/targets/brain";
import { detectQuality, ResolutionGovernor } from "./quality";
import { buildInterior } from "./interior/buildInterior";
import { NeuronInterior } from "./interior/NeuronInterior";
import { clamp01, smoothstep } from "./math";
import { LOOP, STAGES, contactReveal, heroInteractive, interiorPresence, markInteractive } from "./stages";
import { ParticleField } from "./particles/ParticleField";
import { generateNeuronMap, type NeuronHub } from "./particles/targets/neuron";
import { tissueDrift, type Enclosure } from "./shaders/common";
import { TrailField } from "./signature/TrailField";
import { SkyGlow } from "./sky/SkyGlow";
import { connectSomas } from "./synapses/connect";
import { SynapseNetwork } from "./synapses/SynapseNetwork";

const { fov: FOV, cameraZ: CAMERA_Z } = VIEW;
// Pure black: postprocessing's half-float pipeline re-encodes the clear colour, so any
// tint here comes out visibly lifted. Black survives every encoding unchanged.
const VOID_COLOR = 0x000000;
/** css px — keeps every hub at least a 44px touch target. */
const MIN_HIT_RADIUS = 22;

/** A project hub's current on-screen footprint, in css px relative to the canvas. */
export interface HubAnchor {
  slug: string;
  x: number;
  y: number;
  radius: number;
}

export interface ExperienceCallbacks {
  onHover?(hub: HubAnchor | null): void;
  /** Called on every click on the canvas — `null` when it missed every hub. */
  onSelect?(hub: HubAnchor | null): void;
  /** Neurons become clickable only while the hero map is framed. */
  onInteractiveChange?(interactive: boolean): void;
  /**
   * Every frame once the closing sky's contact logos are formed: where each stands on
   * screen (contacts order), or `null` when it is out of view.
   */
  onContactFrame?(rects: (ScreenRect | null)[]): void;
  /**
   * Where the Quacomes mark stands on screen while it is formed on the sand — every
   * frame — then once `null` as it dissolves.
   */
  onMarkFrame?(rect: ScreenRect | null): void;
  /** The GPU dropped the WebGL context — the scene can't go on. */
  onContextLost?(): void;
  /** The first frame has been drawn. */
  onReady?(): void;
  /** Twice a second, how the scene is keeping up — for the `?perf` readout. */
  onStats?(stats: FrameStats): void;
}

export interface FrameStats {
  fps: number;
  /** Mean and worst frame time over the last half second, ms. */
  frameMs: number;
  worstMs: number;
  pixelRatio: number;
  particles: number;
  progress: number;
  postprocessing: boolean;
  gpu: string;
}

/** A box on screen, in css px relative to the canvas. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export class Experience {
  readonly hubs: NeuronHub[];

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  /** Box corners of each contact logo in the closing sky, in contacts order. */
  private readonly contactLogos: [number, number, number][][];
  /** Corners of the Quacomes mark standing on the sand. */
  private readonly markCorners: [number, number, number][];
  private markShown = false;
  private rendered = false;
  /** Every material's shaders are compiled (see the constructor). */
  private compiled = false;

  private readonly composer: EffectComposer;
  private readonly skyGlow = new SkyGlow();
  private readonly field: ParticleField;
  /** Where the cursor has swept across the signature. */
  private readonly trail: TrailField;
  private readonly synapses: SynapseNetwork;
  private readonly interior: NeuronInterior;
  /** The About neuron the camera dives into. */
  private readonly coreCenter: Vector3;
  private readonly coreRadius: number;
  private pixelRatio: number;
  /** Trades resolution for frame rate when frames run slow — unless a test pinned it. */
  private readonly governor: ResolutionGovernor | null;
  /** `?post=0`, for a test: draw the scene straight to the screen, no effects. */
  private readonly bypassPost: boolean;
  private readonly stats = { time: 0, frames: 0, worst: 0, gpu: "" };
  /** Width over height the scene was laid out for — its targets don't follow a resize. */
  readonly layoutAspect: number;
  /** Idle animation is frozen for visitors who asked for reduced motion. */
  private readonly timeScale: number;
  private frame = 0;
  private lastTime = 0;
  private elapsed = 0;

  private hovered: string | null = null;
  private focusPosition: readonly [number, number, number] = [0, 0, 0];
  private focusTarget = 0;
  private focusMix = 0;
  private readonly scratch = new Vector3();
  private readonly scratchView = new Vector3();

  private readonly path: CameraPath;
  private readonly lookTarget = new Vector3();
  private progress = 0;
  private interactive = false;

  /** Cursor in NDC, eased towards where it really is so the dust and camera trail it. */
  private readonly pointerTarget = new Vector2();
  private readonly pointer = new Vector2();
  private pointerPresenceTarget = 0;
  private pointerPresence = 0;
  private readonly pointerWorld = new Vector3();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: ExperienceCallbacks = {},
  ) {
    const quality = detectQuality();
    this.pixelRatio = quality.pixelRatio;
    this.governor = quality.fixedPixelRatio ? null : new ResolutionGovernor(quality.pixelRatio);
    this.bypassPost = new URLSearchParams(window.location.search).get("post") === "0";
    this.timeScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      stencil: false,
      depth: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor(VOID_COLOR, 1);

    const { width, height } = this.viewport();
    this.layoutAspect = width / height;
    // Far enough for the desert's horizon and the sky dome of stars (~420 units out).
    this.camera = new PerspectiveCamera(FOV, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, CAMERA_Z);

    const map = generateNeuronMap({
      budget: quality.particles,
      camera: { z: CAMERA_Z, fov: FOV, aspect: width / height },
      hubs: projects.map((p) => ({ slug: p.slug, weight: p.weight, featured: p.featured })),
    });
    this.hubs = map.hubs;

    const core = new Vector3(map.core.x, map.core.y, map.core.z);
    this.coreCenter = core;
    this.coreRadius = map.core.radius;
    const nearCore = (x: number, y: number, z: number) => core.clone().add(new Vector3(x, y, z));
    // Inside the neuron the nucleus sits at its centre; the camera hangs off to one side so
    // the nucleus is framed beside the About text — right on landscape, above on portrait.
    const landscape = width >= height;
    const insideEnter = landscape
      ? { position: nearCore(-0.1, 0.02, 0.7), target: nearCore(-0.15, 0, -1) }
      : { position: nearCore(0, -0.08, 0.7), target: nearCore(0, -0.12, -1) };
    const insideAbout = landscape
      ? { position: nearCore(-0.22, 0, 0.5), target: nearCore(-0.22, 0.02, -1) }
      : { position: nearCore(0, -0.16, 0.5), target: nearCore(0, -0.16, -1) };
    const galaxyCenter = new Vector3(...GALAXY.center);
    // On narrow (portrait) screens, pull the star-field framings back until the disc fits
    // horizontally; landscape keeps the designed distance.
    const discFit = (GALAXY.radius * 1.1) / (Math.tan((FOV * Math.PI) / 360) * Math.min(1, width / height));
    const galaxyOffset = new Vector3(4, 7, 26).sub(galaxyCenter);
    const galaxyScale = Math.max(1, discFit / galaxyOffset.length());
    const galaxyView = (x: number, y: number, z: number) =>
      new Vector3(x, y, z).sub(galaxyCenter).multiplyScalar(galaxyScale).add(galaxyCenter);
    this.path = new CameraPath([
      // A touch further back on the signature; the camera eases in as the network grows.
      { at: STAGES.signature, position: new Vector3(0, 0, VIEW.signatureZ), target: new Vector3(0, 0, 0) },
      { at: STAGES.hero, position: new Vector3(0, 0, CAMERA_Z), target: new Vector3(0, 0, 0) },
      { at: STAGES.approach, position: nearCore(0.9, 0.35, 3.2), target: nearCore(0.15, 0.05, 0) },
      { at: STAGES.enter, ...insideEnter },
      { at: STAGES.about, ...insideAbout },
      { at: STAGES.brain, position: nearCore(-1.2, 0.4, 5.5), target: nearCore(0, 0, -1) },
      { at: STAGES.galaxy, position: galaxyView(4, 7, 26), target: galaxyCenter },
      // Down with the collapsing disc, to a grain's-eye view of the sand.
      { at: STAGES.sand, position: new Vector3(...SAND.camera), target: new Vector3(...SAND.target) },
      // Up from the grains: the dunes spread out below and the sky opens above.
      { at: STAGES.desert, position: new Vector3(...DESERT.camera), target: new Vector3(...DESERT.target) },
      { at: STAGES.finale, position: new Vector3(...DESERT.finaleCamera), target: new Vector3(...DESERT.finaleTarget) },
      // Pushed on, the camera eases back a little as the logos burst…
      { at: LOOP.explodeEnd, position: new Vector3(0.15, -0.95, 6.6), target: new Vector3(...DESERT.finaleTarget) },
      // …then settles where the journey began, as the dust gathers into the signature.
      { at: LOOP.end, position: new Vector3(0, 0, VIEW.signatureZ), target: new Vector3(0, 0, 0) },
    ]);

    const warp = createBrainWarp({
      camera: { z: CAMERA_Z, fov: FOV, aspect: width / height },
      core: map.core,
    });
    this.synapses = new SynapseNetwork(connectSomas(map.somas), warp);
    const states = buildStates(map, warp, {
      fov: FOV,
      aspect: width / height,
      cameraZ: CAMERA_Z,
      fontFamily: signatureFontFamily(),
    });
    this.field = new ParticleField(map.particles, states);
    // On a phone the near-lens blobs are the heaviest fill of all (inside the About neuron,
    // many at once); smaller, they still read as out-of-focus dust.
    this.field.setMaxPointSize(quality.tier === "low" ? 128 : 256);
    this.contactLogos = states.logos.corners;
    this.markCorners = states.markCorners;
    this.trail = new TrailField(states.signatureBounds);
    this.field.setTrail(this.trail.texture, this.trail.bounds);

    // The interior grows out of the About neuron itself: it starts at the soma's size and
    // its membrane opens exactly where that neuron's dendrites leave.
    this.interior = new NeuronInterior(
      buildInterior({ budget: Math.round(quality.particles / 10), openings: map.coreBranches }),
      [map.core.x, map.core.y, map.core.z],
      map.core.timing,
      map.core.radius,
    );
    this.scene.add(this.skyGlow.mesh, this.synapses.mesh, this.field.points, this.interior.points);
    // Compile every material now, behind the loader. On a phone's GPU a shader compiling the
    // first time its object shows up — the fibres at the network, the About neuron's
    // interior, the desert's sky glow — is a hitch of 100ms or more, mid-journey. (The
    // renderer only compiles what's visible, so the hidden ones are shown for the call.)
    const hidden = [this.skyGlow.mesh, this.synapses.mesh, this.interior.points].filter((o) => !o.visible);
    hidden.forEach((o) => (o.visible = true));
    const compiling = this.renderer.compileAsync(this.scene, this.camera);
    hidden.forEach((o) => (o.visible = false));
    // The loader stays up until they're ready — or a few seconds, should a driver never say.
    const markCompiled = () => (this.compiled = true);
    compiling.then(markCompiled, markCompiled);
    window.setTimeout(markCompiled, 4000);

    const { composer, effects } = createPostProcessing(this.renderer, this.scene, this.camera, quality.tier);
    this.composer = composer;

    if (process.env.NODE_ENV === "development") {
      Object.assign(window, {
        __experience: {
          experience: this,
          ...effects,
          field: this.field,
          synapses: this.synapses,
        },
      });
    }

    this.resize();
    window.addEventListener("resize", this.resize);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("click", this.onClick);
    // The cursor is tracked across the whole window — overlays sit above the canvas.
    window.addEventListener("pointermove", this.onWindowPointerMove);
    document.documentElement.addEventListener("pointerleave", this.onWindowPointerLeave);
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("click", this.onClick);
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    document.documentElement.removeEventListener("pointerleave", this.onWindowPointerLeave);
    this.canvas.style.cursor = "";
    this.field.dispose();
    this.trail.dispose();
    this.synapses.dispose();
    this.interior.dispose();
    this.skyGlow.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  /** Scroll journey position, 0..1 — already smoothed by the scroll driver. */
  setProgress(progress: number): void {
    this.progress = progress;
  }

  /** Where a project's neuron currently sits on screen, or `null` if it isn't framed. */
  hubAnchor(slug: string): HubAnchor | null {
    if (!this.interactive) return null;
    const hub = this.hubs.find((h) => h.slug === slug);
    return hub ? this.anchorOf(hub) : null;
  }

  /** Spotlight a project's neuron (or release the spotlight with `null`). */
  setFocus(slug: string | null): void {
    const hub = slug ? this.hubs.find((h) => h.slug === slug) : undefined;
    if (hub) this.focusPosition = hub.position;
    this.focusTarget = hub ? 1 : 0;
    if (this.timeScale === 0) this.focusMix = this.focusTarget;
  }

  private viewport() {
    return {
      width: Math.max(1, this.canvas.clientWidth),
      height: Math.max(1, this.canvas.clientHeight),
    };
  }

  private anchorOf(hub: NeuronHub): HubAnchor | null {
    const [x, y, z] = hub.position;
    const [dx, dy, dz] = tissueDrift(x, y, z, this.elapsed);
    this.camera.updateMatrixWorld();
    const world = this.scratch.set(x + dx, y + dy, z + dz);
    const dist = -this.scratchView.copy(world).applyMatrix4(this.camera.matrixWorldInverse).z;
    if (dist <= this.camera.near) return null;

    const ndc = world.project(this.camera);
    if (Math.abs(ndc.x) > 1.1 || Math.abs(ndc.y) > 1.1) return null;

    const { width, height } = this.viewport();
    const pxPerUnit = height / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
    return {
      slug: hub.slug,
      x: ((ndc.x + 1) / 2) * width,
      y: ((1 - ndc.y) / 2) * height,
      radius: hub.radius * pxPerUnit,
    };
  }

  private hitTest(event: MouseEvent): HubAnchor | null {
    if (!this.interactive) return null;
    const rect = this.canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    let best: HubAnchor | null = null;
    let bestDistance = Infinity;
    for (const hub of this.hubs) {
      const anchor = this.anchorOf(hub);
      if (!anchor) continue;
      const d = Math.hypot(anchor.x - px, anchor.y - py);
      if (d < Math.max(anchor.radius, MIN_HIT_RADIUS) && d < bestDistance) {
        best = anchor;
        bestDistance = d;
      }
    }
    return best;
  }

  private setHovered(hit: HubAnchor | null): void {
    this.canvas.style.cursor = hit ? "pointer" : "";
    const slug = hit?.slug ?? null;
    if (slug === this.hovered) return;
    this.hovered = slug;
    this.callbacks.onHover?.(hit);
  }

  /** Brighten the contact logo under the pointer or keyboard focus (contacts order), or none. */
  setContactHover(index: number | null): void {
    this.field.setLogoHover(index);
  }

  /** Where a box of world-space corners lands on screen, or `null` if it's behind the camera. */
  private screenRect(corners: readonly (readonly [number, number, number])[]): ScreenRect | null {
    const { width, height } = this.viewport();
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const [x, y, z] of corners) {
      const ndc = this.scratch.set(x, y, z).project(this.camera);
      if (ndc.z > 1) return null;
      const sx = ((ndc.x + 1) / 2) * width;
      const sy = ((1 - ndc.y) / 2) * height;
      left = Math.min(left, sx);
      right = Math.max(right, sx);
      top = Math.min(top, sy);
      bottom = Math.max(bottom, sy);
    }
    return { left, top, width: right - left, height: bottom - top };
  }

  /** Report where the contact logos stand on screen, so their links can be laid over them. */
  private projectContacts(): void {
    if (!this.callbacks.onContactFrame || contactReveal(this.progress) <= 0) return;
    this.callbacks.onContactFrame(this.contactLogos.map((corners) => this.screenRect(corners)));
  }

  /** Report where the Quacomes mark stands on screen, so its link can be laid over it. */
  private projectMark(): void {
    if (!this.callbacks.onMarkFrame) return;
    if (!markInteractive(this.progress)) {
      if (this.markShown) this.callbacks.onMarkFrame(null);
      this.markShown = false;
      return;
    }
    this.markShown = true;
    this.callbacks.onMarkFrame(this.screenRect(this.markCorners));
  }

  private syncInteractive(): void {
    const interactive = heroInteractive(this.progress);
    if (interactive === this.interactive) return;
    this.interactive = interactive;
    if (!interactive) this.setHovered(null);
    this.callbacks.onInteractiveChange?.(interactive);
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse") this.setHovered(this.hitTest(event));
  };

  private onPointerLeave = () => this.setHovered(null);

  private onWindowPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerTarget.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.pointerPresenceTarget = 1;
  };

  private onWindowPointerLeave = () => {
    this.pointerPresenceTarget = 0;
  };

  private onClick = (event: MouseEvent) => {
    const hit = this.hitTest(event);
    // A click can arrive without a preceding move (touch, synthetic) — resync hover too.
    this.setHovered(hit);
    this.callbacks.onSelect?.(hit);
  };

  private onContextLost = () => this.callbacks.onContextLost?.();

  /** Tally frame times and hand them to the `?perf` readout twice a second. */
  private reportStats(delta: number): void {
    if (!this.callbacks.onStats || delta <= 0) return;
    const s = this.stats;
    s.time += delta;
    s.frames++;
    s.worst = Math.max(s.worst, delta);
    if (s.time < 0.5) return;
    if (!s.gpu) {
      const gl = this.renderer.getContext();
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      s.gpu = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    }
    this.callbacks.onStats({
      fps: s.frames / s.time,
      frameMs: (s.time / s.frames) * 1000,
      worstMs: s.worst * 1000,
      pixelRatio: this.pixelRatio,
      particles: this.field.points.geometry.attributes.position.count,
      progress: this.progress,
      postprocessing: !this.bypassPost,
      gpu: s.gpu,
    });
    s.time = 0;
    s.frames = 0;
    s.worst = 0;
  }

  private resize = () => {
    const { width, height } = this.viewport();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height, false);
    this.field.setViewport(height, this.pixelRatio, FOV);
    this.synapses.setViewport(width, height, this.pixelRatio);
    this.interior.setViewport(height, this.pixelRatio, FOV);
  };

  private tick = (time: number) => {
    // Clamp so returning to a background tab doesn't lurch the animation forward.
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 0;
    this.lastTime = time;
    this.elapsed += delta * this.timeScale;
    const ratio = this.governor?.sample(delta) ?? null;
    if (ratio !== null) {
      this.pixelRatio = ratio;
      this.renderer.setPixelRatio(ratio);
      this.resize();
    }

    // Exponential ease: the spotlight swells in and ebbs out rather than switching.
    this.focusMix += (this.focusTarget - this.focusMix) * (1 - Math.exp(-delta * 3.5));
    this.syncInteractive();

    this.path.evaluate(this.progress, this.camera.position, this.lookTarget);
    const subjectDistance = this.camera.position.distanceTo(this.lookTarget);
    // A faint handheld sway, damped as the camera closes in on something.
    const sway = Math.min(1, subjectDistance / 10);
    this.camera.position.x += Math.sin(this.elapsed * 0.13) * 0.06 * sway;
    this.camera.position.y += Math.sin(this.elapsed * 0.17 + 1.3) * 0.04 * sway;

    const trail = 1 - Math.exp(-delta * 4);
    this.pointer.lerp(this.pointerTarget, trail);
    this.pointerPresence += (this.pointerPresenceTarget - this.pointerPresence) * trail;
    // Mouse parallax on the opening screens: the camera leans after the cursor, so dust at
    // different depths slides past at different rates.
    // (It fades back in as the loop returns to the signature, so the seam doesn't jolt.)
    const parallax =
      (1 - smoothstep(STAGES.hero + 0.02, STAGES.approach, this.progress) + smoothstep(LOOP.gatherStart, LOOP.end, this.progress)) *
      this.pointerPresence *
      this.timeScale;
    this.camera.position.x += this.pointer.x * 0.45 * parallax;
    this.camera.position.y += this.pointer.y * 0.28 * parallax;
    this.camera.lookAt(this.lookTarget);

    // The cursor sweeps a trail through the signature — from its raw position, un-eased, so
    // the grains answer the hand at once. Find where it lands on the letters' plane (z = 0).
    this.camera.updateMatrixWorld();
    const ray = this.scratch.set(this.pointerTarget.x, this.pointerTarget.y, 0.5).unproject(this.camera);
    ray.sub(this.camera.position).normalize();
    if (Math.abs(ray.z) > 1e-3) {
      this.pointerWorld.copy(this.camera.position).addScaledVector(ray, -this.camera.position.z / ray.z);
    }
    const stirring = this.pointerPresenceTarget > 0 && this.progress < STAGES.hero * 0.6;
    this.trail.update(delta, stirring ? this.pointerWorld : null);
    // Haze sets in just beyond whatever the camera is looking at.
    // Out in the desert the sky is hundreds of units away: lift the haze off it entirely.
    // Settling back into the haze of the opening as the loop returns to the signature.
    const desert =
      smoothstep(STAGES.sand + 0.015, STAGES.desert, this.progress) *
      (1 - smoothstep(LOOP.gatherStart, LOOP.end, this.progress));
    const hazeStart = Math.max(subjectDistance - 1, desert * 1000);
    this.skyGlow.update(desert);

    this.field.update(this.elapsed, this.progress, hazeStart, delta);
    this.field.setFocus(this.focusPosition, this.focusMix);
    this.synapses.update(this.elapsed, this.progress, hazeStart);
    this.synapses.setFocus(this.focusPosition, this.focusMix);
    const presence = interiorPresence(this.progress);
    this.interior.update(this.elapsed, presence);
    const enclosure: Enclosure = {
      center: this.coreCenter,
      radius: this.interior.membraneRadius(presence),
      somaRadius: this.coreRadius,
      // Only once the wall is really around the camera does the outside recede behind it.
      dim: clamp01((presence - 0.5) / 0.5),
      // The map's own nucleus and body hand over to the interior as it fades in.
      swallow: smoothstep(0.05, 0.45, presence),
    };
    this.field.setEnclosure(enclosure);
    this.synapses.setEnclosure(enclosure);
    this.projectContacts();
    this.projectMark();
    if (this.bypassPost) this.renderer.render(this.scene, this.camera);
    else this.composer.render(delta);
    if (!this.rendered && this.compiled) {
      this.rendered = true;
      this.callbacks.onReady?.();
    }
    this.reportStats(delta);
    this.frame = requestAnimationFrame(this.tick);
  };
}
