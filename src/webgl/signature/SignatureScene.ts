import {
  BufferAttribute,
  BufferGeometry,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { EffectComposer } from "postprocessing";
import { signatureFontFamily } from "../fonts";
import { VIEW } from "../layout";
import { AZURE, EMBER, PALE, TEAL, VIOLET, type RGB } from "../palette";
import { particleBlending, particleFragmentShader } from "../particles/shaders";
import { buildSignatureTargets } from "../particles/targets/signature";
import { createPostProcessing } from "../postprocessing";
import { detectQuality, ResolutionGovernor } from "../quality";
import { createRandom } from "../random";
import { glslCommon } from "../shaders/common";
import { glslSignature } from "./glsl";
import { TrailField } from "./TrailField";

const vertexShader = /* glsl */ `
  ${glslCommon}
  ${glslSignature}

  attribute float aBright;
  attribute float aSeed;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale; // viewport height (css px) / (2 * tan(fov / 2))

  // Shared fragment shader: these are always glowing points.
  varying vec3 vColor;
  varying float vBright;
  varying float vSeed;
  varying float vGrain;
  varying float vSolid;
  varying vec4 vLump;

  void main() {
    vec3 p = signaturePosition(position, aSeed, uTime);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = -mvPosition.z;
    float size = signatureSize(aBright, aSeed) * uSizeScale * uPixelRatio / dist;
    // Keep sub-pixel points from shimmering: clamp the sprite but conserve energy.
    float sprite = max(size, 2.0);
    float energy = min(1.0, (size * size) / (sprite * sprite));
    gl_PointSize = min(sprite, 256.0);

    vColor = signatureColor(aColor);
    vBright = aBright * signatureGlow(aSeed, uTime) * energy * depthFade(dist);
    vSeed = aSeed;
    vGrain = 0.0;
    vSolid = 0.0;
    vLump = lumpPhase(aSeed);
  }
`;

/** The faint tints the signature's dust carries — the colours of the network it becomes. */
const TINTS: RGB[] = [AZURE, VIOLET, TEAL, PALE];

/**
 * The journey's opening signature on its own — the same luminous dust, bevelled relief,
 * cursor trail, sway and parallax — spelling any short text, for pages outside the
 * journey such as the 404.
 */
export class SignatureScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly composer: EffectComposer;
  private readonly geometry = new BufferGeometry();
  private readonly material: ShaderMaterial;
  private readonly trail: TrailField;
  private pixelRatio: number;
  /** Trades resolution for frame rate when frames run slow. */
  private readonly governor: ResolutionGovernor;
  /** Idle animation is frozen for visitors who asked for reduced motion. */
  private readonly timeScale: number;
  private frame = 0;
  private rendered = false;
  private lastTime = 0;
  private elapsed = 0;

  /** Cursor in NDC, eased towards where it really is so the camera trails it. */
  private readonly pointerTarget = new Vector2();
  private readonly pointer = new Vector2();
  private pointerPresenceTarget = 0;
  private pointerPresence = 0;
  private readonly pointerWorld = new Vector3();
  private readonly scratch = new Vector3();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    text: string,
    /** Called once the first frame has been drawn. */
    private readonly onReady?: () => void,
  ) {
    const quality = detectQuality();
    this.pixelRatio = quality.pixelRatio;
    this.governor = new ResolutionGovernor(quality.pixelRatio);
    this.timeScale = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      stencil: false,
      depth: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(this.pixelRatio);
    // Pure black — see the journey's VOID_COLOR.
    this.renderer.setClearColor(0x000000, 1);

    const { width, height } = this.viewport();
    this.camera = new PerspectiveCamera(VIEW.fov, width / height, 0.1, 100);

    const count = quality.particles;
    const { positions, bounds } = buildSignatureTargets(count, {
      cameraZ: VIEW.cameraZ,
      fov: VIEW.fov,
      aspect: width / height,
      fontFamily: signatureFontFamily(),
      text,
    });
    const home = new Float32Array(count * 3);
    const brightness = new Float32Array(count);
    const seeds = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const random = createRandom(97);
    for (let i = 0; i < count; i++) {
      home.set(positions.subarray(i * 4, i * 4 + 3), i * 3);
      brightness[i] = positions[i * 4 + 3];
      seeds[i] = random();
      colors.set(random() < 0.1 ? EMBER : TINTS[Math.floor(random() * TINTS.length)], i * 3);
    }
    this.geometry.setAttribute("position", new BufferAttribute(home, 3));
    this.geometry.setAttribute("aBright", new BufferAttribute(brightness, 1));
    this.geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    this.geometry.setAttribute("aColor", new BufferAttribute(colors, 3));

    this.trail = new TrailField(bounds);
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.pixelRatio },
        uSizeScale: { value: 1 },
        // Haze sets in just beyond the letters, as it does on the journey's opening.
        uHazeStart: { value: VIEW.signatureZ - 1 },
        uTrail: { value: this.trail.texture },
        uTrailBounds: { value: this.trail.bounds },
      },
      ...particleBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const points = new Points(this.geometry, this.material);
    points.frustumCulled = false;
    this.scene.add(points);

    this.composer = createPostProcessing(this.renderer, this.scene, this.camera, quality.tier).composer;

    this.resize();
    window.addEventListener("resize", this.resize);
    // The cursor is tracked across the whole window — overlays sit above the canvas.
    window.addEventListener("pointermove", this.onPointerMove);
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    this.frame = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.onPointerMove);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    this.geometry.dispose();
    this.material.dispose();
    this.trail.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }

  private viewport() {
    return {
      width: Math.max(1, this.canvas.clientWidth),
      height: Math.max(1, this.canvas.clientHeight),
    };
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerTarget.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.pointerPresenceTarget = 1;
  };

  private onPointerLeave = () => {
    this.pointerPresenceTarget = 0;
  };

  private resize = () => {
    const { width, height } = this.viewport();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(width, height, false);
    this.material.uniforms.uSizeScale.value = height / (2 * Math.tan((VIEW.fov * Math.PI) / 360));
    this.material.uniforms.uPixelRatio.value = this.pixelRatio;
  };

  private tick = (time: number) => {
    // Clamp so returning to a background tab doesn't lurch the animation forward.
    const delta = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.1) : 0;
    this.lastTime = time;
    this.elapsed += delta * this.timeScale;
    const ratio = this.governor.sample(delta);
    if (ratio !== null) {
      this.pixelRatio = ratio;
      this.renderer.setPixelRatio(ratio);
      this.resize();
    }

    const ease = 1 - Math.exp(-delta * 4);
    this.pointer.lerp(this.pointerTarget, ease);
    this.pointerPresence += (this.pointerPresenceTarget - this.pointerPresence) * ease;
    // The journey's opening camera: a faint handheld sway, leaning after the cursor.
    const parallax = this.pointerPresence * this.timeScale;
    this.camera.position.set(
      Math.sin(this.elapsed * 0.13) * 0.06 + this.pointer.x * 0.45 * parallax,
      Math.sin(this.elapsed * 0.17 + 1.3) * 0.04 + this.pointer.y * 0.28 * parallax,
      VIEW.signatureZ,
    );
    this.camera.lookAt(0, 0, 0);

    // The cursor sweeps a trail through the letters — from its raw position, un-eased, so
    // the grains answer the hand at once. Find where it lands on the letters' plane (z = 0).
    this.camera.updateMatrixWorld();
    const ray = this.scratch.set(this.pointerTarget.x, this.pointerTarget.y, 0.5).unproject(this.camera);
    ray.sub(this.camera.position).normalize();
    if (Math.abs(ray.z) > 1e-3) {
      this.pointerWorld.copy(this.camera.position).addScaledVector(ray, -this.camera.position.z / ray.z);
    }
    this.trail.update(delta, this.pointerPresenceTarget > 0 ? this.pointerWorld : null);

    this.material.uniforms.uTime.value = this.elapsed;
    this.composer.render(delta);
    if (!this.rendered) {
      this.rendered = true;
      this.onReady?.();
    }
    this.frame = requestAnimationFrame(this.tick);
  };
}
