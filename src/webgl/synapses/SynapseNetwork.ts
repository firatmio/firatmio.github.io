import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import type { BrainWarp } from "../particles/targets/brain";
import type { Enclosure } from "../shaders/common";
import { STAGES } from "../stages";
import type { SynapseCurve } from "./connect";
import { synapseFragmentShader, synapseVertexShader } from "./shaders";

/** Nerve fibres between neurons, drawn as screen-space ribbons with travelling signals. */
export class SynapseNetwork {
  readonly mesh: Mesh;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;

  constructor(curves: SynapseCurve[], warp: BrainWarp) {
    let vertexCount = 0;
    let indexCount = 0;
    for (const curve of curves) {
      const n = curve.points.length / 3;
      vertexCount += n * 2;
      indexCount += (n - 1) * 6;
    }

    const position = new Float32Array(vertexCount * 3);
    const prev = new Float32Array(vertexCount * 3);
    const next = new Float32Array(vertexCount * 3);
    const positionBrain = new Float32Array(vertexCount * 3);
    const prevBrain = new Float32Array(vertexCount * 3);
    const nextBrain = new Float32Array(vertexCount * 3);
    const morph = new Float32Array(vertexCount);
    const side = new Float32Array(vertexCount);
    const u = new Float32Array(vertexCount);
    const color = new Float32Array(vertexCount * 3);
    const timing = new Float32Array(vertexCount * 4);
    const style = new Float32Array(vertexCount * 4);
    const index = new Uint32Array(indexCount);

    let v = 0;
    let ii = 0;
    for (const curve of curves) {
      const pts = curve.points;
      const n = pts.length / 3;

      // The fibre's shape in the brain state: the same spatial warp the particles use.
      const brain = new Float32Array(n * 3);
      const delay = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        brain.set(warp.at(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]), i * 3);
        delay[i] = warp.delay(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      }

      const base = v;
      let travelled = 0;
      for (let i = 0; i < n; i++) {
        if (i > 0) {
          travelled += Math.hypot(
            pts[i * 3] - pts[i * 3 - 3],
            pts[i * 3 + 1] - pts[i * 3 - 2],
            pts[i * 3 + 2] - pts[i * 3 - 1],
          );
        }
        const p = Math.max(i - 1, 0) * 3;
        const q = Math.min(i + 1, n - 1) * 3;
        for (const s of [-1, 1]) {
          position.set(pts.subarray(i * 3, i * 3 + 3), v * 3);
          prev.set(pts.subarray(p, p + 3), v * 3);
          next.set(pts.subarray(q, q + 3), v * 3);
          positionBrain.set(brain.subarray(i * 3, i * 3 + 3), v * 3);
          prevBrain.set(brain.subarray(p, p + 3), v * 3);
          nextBrain.set(brain.subarray(q, q + 3), v * 3);
          morph[v] = delay[i];
          side[v] = s;
          u[v] = travelled / curve.length;
          color.set(curve.color, v * 3);
          timing.set([curve.timing.period, curve.timing.phase, curve.timing.reliability, curve.travel], v * 4);
          style.set([curve.halfWidth, curve.brightness, curve.seed, curve.length], v * 4);
          v++;
        }
      }
      for (let i = 0; i < n - 1; i++) {
        const a = base + i * 2;
        index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ii);
        ii += 6;
      }
    }

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", new BufferAttribute(position, 3));
    this.geometry.setAttribute("aPrev", new BufferAttribute(prev, 3));
    this.geometry.setAttribute("aNext", new BufferAttribute(next, 3));
    this.geometry.setAttribute("aPosBrain", new BufferAttribute(positionBrain, 3));
    this.geometry.setAttribute("aPrevBrain", new BufferAttribute(prevBrain, 3));
    this.geometry.setAttribute("aNextBrain", new BufferAttribute(nextBrain, 3));
    this.geometry.setAttribute("aMorph", new BufferAttribute(morph, 1));
    this.geometry.setAttribute("aSide", new BufferAttribute(side, 1));
    this.geometry.setAttribute("aU", new BufferAttribute(u, 1));
    this.geometry.setAttribute("aColor", new BufferAttribute(color, 3));
    this.geometry.setAttribute("aTiming", new BufferAttribute(timing, 4));
    this.geometry.setAttribute("aStyle", new BufferAttribute(style, 4));
    this.geometry.setIndex(new BufferAttribute(index, 1));

    this.material = new ShaderMaterial({
      vertexShader: synapseVertexShader,
      fragmentShader: synapseFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uResolution: { value: new Vector2(1, 1) },
        uFocus: { value: new Vector3() },
        uFocusMix: { value: 0 },
        uProgress: { value: 0 },
        uHazeStart: { value: 9 },
        uEnclosureCenter: { value: new Vector3() },
        uEnclosureRadius: { value: 1 },
        uEnclosure: { value: 0 },
        uSomaRadius: { value: 1 },
        uSwallow: { value: 0 },
      },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  setViewport(widthCss: number, heightCss: number, pixelRatio: number): void {
    this.material.uniforms.uResolution.value.set(widthCss * pixelRatio, heightCss * pixelRatio);
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  update(time: number, progress: number, hazeStart: number): void {
    // Fibres exist only from the grown network until they dissolve before the star field
    // (the shader's `grown` and `web`). Outside that, don't draw them at all — every vertex
    // of every ribbon would otherwise work out the tissue three times, only to be discarded.
    this.mesh.visible = progress > STAGES.hero - 0.03 && progress < STAGES.brain + 0.03;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uProgress.value = progress;
    this.material.uniforms.uHazeStart.value = hazeStart;
  }

  setFocus(position: readonly [number, number, number], amount: number): void {
    this.material.uniforms.uFocus.value.set(...position);
    this.material.uniforms.uFocusMix.value = amount;
  }

  /** The About neuron swelling around the camera: push, absorb and dim the fibres. */
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
