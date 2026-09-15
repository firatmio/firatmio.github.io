import { AdditiveBlending, BackSide, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import { DESERT } from "../layout";

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uCenter;
  uniform vec3 uMoon;
  uniform float uAmount;
  varying vec3 vWorld;

  void main() {
    vec3 dir = normalize(vWorld - uCenter);
    float above = smoothstep(-0.01, 0.03, dir.y);
    // Airglow: a thin veil of light hugging the horizon, a touch warmer on the moon's side.
    float veil = exp(-max(dir.y, 0.0) * 9.0) * above;
    vec2 bearing = normalize(dir.xz + 1e-5);
    float moonSide = pow(max(dot(bearing, normalize(uMoon.xz)), 0.0), 3.0);
    vec3 color = mix(vec3(0.01, 0.025, 0.05), vec3(0.05, 0.04, 0.035), moonSide) * veil * 1.6;
    gl_FragColor = vec4(color * uAmount, 1.0);
  }
`;

/**
 * The faint atmosphere of the night desert — a glow along the horizon behind the dunes.
 * Additive and depth-free, so it only ever adds a breath of light to the black sky.
 */
export class SkyGlow {
  readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly geometry = new SphereGeometry(440, 48, 24);

  constructor() {
    const center = new Vector3(...DESERT.camera);
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uCenter: { value: center },
        uMoon: { value: new Vector3(...DESERT.moon) },
        uAmount: { value: 0 },
      },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.copy(center);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
    this.mesh.visible = false;
  }

  /** @param amount 0..1 — how far the journey has arrived in the desert. */
  update(amount: number): void {
    this.mesh.visible = amount > 0.001;
    this.material.uniforms.uAmount.value = amount;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
