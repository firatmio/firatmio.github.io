import {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  type Texture,
} from "three";
import { SAND } from "../layout";
import type { Enclosure } from "../shaders/common";
import type { ParticleBuffers } from "./buffers";
import { particleBlending, particleFragmentShader, particleVertexShader } from "./shaders";
import type { StateBuffers } from "./states";
import { LOGO_PALETTE_SIZE } from "./targets/desert";

/**
 * The particles in far-to-near order as the sand camera sees their sand targets. There the
 * settled grains are opaque, and with no depth buffer the draw order is what lets near
 * grains cover far ones. Everywhere else the particles only add light, so it doesn't
 * matter.
 */
function sandDrawOrder(sand: Float32Array, count: number): Uint32Array {
  const [cx, cy, cz] = SAND.camera;
  const [tx, ty, tz] = SAND.target;
  const l = Math.hypot(tx - cx, ty - cy, tz - cz);
  const [dx, dy, dz] = [(tx - cx) / l, (ty - cy) / l, (tz - cz) / l];
  const depth = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    depth[i] = (sand[i * 3] - cx) * dx + (sand[i * 3 + 1] - cy) * dy + (sand[i * 3 + 2] - cz) * dz;
  }
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) order[i] = i;
  return order.sort((a, b) => depth[b] - depth[a]);
}

/**
 * The single particle system every scene state (neuron → brain → galaxy → sand) is drawn
 * with. Each state is another set of target attributes; the vertex shader blends between
 * them from scroll progress, so no particle position is ever computed per frame on the CPU.
 */
export class ParticleField {
  readonly points: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;
  /** The contact logo under the pointer, if any. */
  private logoHover: number | null = null;

  constructor(buffers: ParticleBuffers, states: StateBuffers) {
    const { count } = buffers;
    const attribute = (array: Float32Array, size: number) =>
      new BufferAttribute(array.subarray(0, count * size), size);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", attribute(buffers.positions, 3));
    this.geometry.setAttribute("aColor", attribute(buffers.colors, 3));
    // Size, brightness, seed and contact-logo colour share one attribute slot (see the
    // vertex shader).
    const traits = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      traits[i * 4] = buffers.sizes[i];
      traits[i * 4 + 1] = buffers.brightness[i];
      traits[i * 4 + 2] = buffers.seeds[i];
      traits[i * 4 + 3] = states.logoTones[i];
    }
    this.geometry.setAttribute("aTraits", attribute(traits, 4));
    this.geometry.setAttribute("aPulse", attribute(buffers.pulses, 4));
    this.geometry.setAttribute("aPosSig", attribute(states.signature, 4));
    this.geometry.setAttribute("aPosBrain", attribute(states.brain, 3));
    this.geometry.setAttribute("aPosGalaxy", attribute(states.galaxy, 3));
    this.geometry.setAttribute("aStar", attribute(states.stars, 4));
    this.geometry.setAttribute("aPosSand", attribute(states.sand, 3));
    this.geometry.setAttribute("aSand", attribute(states.grains, 4));
    this.geometry.setAttribute("aPosDesert", attribute(states.desert, 4));
    this.geometry.setAttribute("aDesert", attribute(states.desertLooks, 4));
    this.geometry.setAttribute("aMorph", attribute(states.morph, 4));
    this.geometry.setIndex(new BufferAttribute(sandDrawOrder(states.sand, count), 1));
    const { logos } = states;

    this.material = new ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSizeScale: { value: 1 },
        uFocus: { value: new Vector3() },
        uFocusMix: { value: 0 },
        uProgress: { value: 0 },
        uHazeStart: { value: 9 },
        uEnclosureCenter: { value: new Vector3() },
        uEnclosureRadius: { value: 1 },
        uEnclosure: { value: 0 },
        uSomaRadius: { value: 1 },
        uSwallow: { value: 0 },
        uTrail: { value: null as Texture | null },
        uTrailBounds: { value: new Vector4(0, 0, 1, 1) },
        uLogoOrigin: { value: new Vector3(...logos.origin) },
        uLogoAxisU: { value: new Vector3(...logos.axisU) },
        uLogoAxisV: { value: new Vector3(...logos.axisV) },
        uLogoCells: { value: logos.cells.map(([u, v]) => new Vector2(u, v)) },
        uLogoPalette: {
          value: Array.from({ length: LOGO_PALETTE_SIZE }, (_, k) => new Vector3(...(logos.palette[k] ?? [0, 0, 0]))),
        },
        uLogoGrain: { value: logos.grain },
        uLogoGlow: { value: logos.cells.map(() => 0) },
      },
      ...particleBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  setViewport(heightCss: number, pixelRatio: number, fovDeg: number): void {
    this.material.uniforms.uSizeScale.value = heightCss / (2 * Math.tan((fovDeg * Math.PI) / 360));
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  update(time: number, progress: number, hazeStart: number, delta: number): void {
    // Hover glows swell in and ebb out rather than switching.
    const glows: number[] = this.material.uniforms.uLogoGlow.value;
    const ease = 1 - Math.exp(-delta * 5);
    glows.forEach((glow, k) => {
      glows[k] = glow + ((k === this.logoHover ? 1 : 0) - glow) * ease;
    });
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uProgress.value = progress;
    this.material.uniforms.uHazeStart.value = hazeStart;
  }

  setFocus(position: readonly [number, number, number], amount: number): void {
    this.material.uniforms.uFocus.value.set(...position);
    this.material.uniforms.uFocusMix.value = amount;
  }

  /** Brighten one of the finale's contact logos (contacts order), or none — eased in update(). */
  setLogoHover(index: number | null): void {
    this.logoHover = index;
  }

  /** The cursor's trail over the signature, and the world rect it covers. */
  setTrail(texture: Texture, bounds: Vector4): void {
    this.material.uniforms.uTrail.value = texture;
    this.material.uniforms.uTrailBounds.value.copy(bounds);
  }

  /** The About neuron swelling around the camera: push, absorb and dim the tissue. */
  setEnclosure(enclosure: Enclosure): void {
    const u = this.material.uniforms;
    u.uEnclosureCenter.value.copy(enclosure.center);
    u.uEnclosureRadius.value = enclosure.radius;
    u.uEnclosure.value = enclosure.dim;
    u.uSomaRadius.value = enclosure.somaRadius;
    u.uSwallow.value = enclosure.swallow;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
