import {
  BufferAttribute,
  BufferGeometry,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { smoothstep } from "../math";
import type { Timing } from "../particles/buffers";
import { particleBlending, particleFragmentShader } from "../particles/shaders";
import type { InteriorBuffers } from "./buildInterior";
import { interiorVertexShader } from "./shaders";

/** World radius of the membrane once it has fully swallowed the camera. */
const MEMBRANE_RADIUS = 1.2;

/**
 * The inside of the About neuron. It grows out of that neuron itself: at rest it is the
 * size of the soma, it swells to envelop the camera on the way in, and folds back into
 * the soma as the camera leaves.
 */
export class NeuronInterior {
  readonly points: Points;
  private readonly geometry: BufferGeometry;
  private readonly material: ShaderMaterial;

  constructor(
    buffers: InteriorBuffers,
    center: readonly [number, number, number],
    timing: Timing,
    private readonly somaRadius: number,
  ) {
    const { count } = buffers;
    const attribute = (array: Float32Array, size: number) =>
      new BufferAttribute(array.subarray(0, count * size), size);

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", attribute(buffers.positions, 3));
    this.geometry.setAttribute("aControl", attribute(buffers.controls, 3));
    this.geometry.setAttribute("aEnd", attribute(buffers.ends, 3));
    this.geometry.setAttribute("aColor", attribute(buffers.colors, 3));
    this.geometry.setAttribute("aSize", attribute(buffers.sizes, 1));
    this.geometry.setAttribute("aBright", attribute(buffers.brightness, 1));
    this.geometry.setAttribute("aSeed", attribute(buffers.seeds, 1));
    this.geometry.setAttribute("aKind", attribute(buffers.kinds, 1));

    this.material = new ShaderMaterial({
      vertexShader: interiorVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSizeScale: { value: 1 },
        uCenter: { value: new Vector3(...center) },
        uScale: { value: somaRadius },
        uPresence: { value: 0 },
        uCorePulse: { value: new Vector3(timing.period, timing.phase, timing.reliability) },
      },
      ...particleBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.visible = false;
  }

  /** World radius of the membrane at a given presence (0 = the soma, 1 = around the camera). */
  membraneRadius(presence: number): number {
    return this.somaRadius + (MEMBRANE_RADIUS - this.somaRadius) * presence;
  }

  setViewport(heightCss: number, pixelRatio: number, fovDeg: number): void {
    this.material.uniforms.uSizeScale.value = heightCss / (2 * Math.tan((fovDeg * Math.PI) / 360));
    this.material.uniforms.uPixelRatio.value = pixelRatio;
  }

  /** @param presence 0 = folded back into the soma, 1 = wrapped around the camera. */
  update(time: number, presence: number): void {
    this.points.visible = presence > 0.001;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = this.membraneRadius(presence);
    this.material.uniforms.uPresence.value = smoothstep(0, 0.35, presence);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
