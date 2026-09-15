import { createNoise3D } from "simplex-noise";
import { GALAXY } from "../../layout";
import { EMBER, PALE, mix, type RGB } from "../../palette";
import { createRandom, gaussian } from "../../random";
import { ROLE, type ParticleBuffers } from "../buffers";
import type { Soma } from "./neuron";

export interface GalaxyTargets {
  positions: Float32Array;
  /** Star colour (rgb) and a brightness/size boost (w) for the galaxy state. */
  stars: Float32Array;
  /** Per-particle wait (0..1 of the transition window) — the outskirts arrive last. */
  delays: Float32Array;
}

type Vec3 = [number, number, number];

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const BULGE: RGB = [1.0, 0.76, 0.48];
const YOUNG: RGB = [0.55, 0.72, 1.0];

/**
 * The star-field state: every neuron becomes a knot of stars on a spiral arm, its
 * dendrites stretched into streams along the arm; the About neuron becomes the nucleus.
 * The arms are lopsided and noise-bent — two dominant arms and a weak spur.
 */
export function buildGalaxyTargets(
  particles: ParticleBuffers,
  somas: Soma[],
  core: Soma,
  seed = 314,
): GalaxyTargets {
  const random = createRandom(seed);
  const noise = createNoise3D(random);
  const { count, roles, groups, pulses } = particles;

  const axis = [...GALAXY.axis] as Vec3;
  const u = normalize(cross(axis, [0, 0, 1]));
  const v = cross(axis, u);
  const [cx, cy, cz] = GALAXY.center;
  const R = GALAXY.radius;

  const arms = [
    { phase: 0, pitch: 0.27, weight: 0.44 },
    { phase: Math.PI + 0.35, pitch: 0.33, weight: 0.4 },
    { phase: 2.1, pitch: 0.42, weight: 0.16 },
  ];
  const armAngle = (arm: number, r: number) =>
    arms[arm].phase +
    Math.log(Math.max(r, 0.25) / 0.6) / Math.tan(arms[arm].pitch) +
    noise(r * 0.22, arm * 7.1, 0.5) * 0.8 +
    // Fine wander, scaled down with radius so its sideways reach stays small out in the
    // disc instead of kinking the outer arms into zigzags.
    noise(r * 1.1, arm * 3.3, 4.2) * (0.22 / Math.max(r, 1.5));
  // Arms swell and pinch along their length — knots of star formation, not a tube.
  const armWidth = (arm: number, r: number) =>
    (0.45 + 0.12 * r) * (0.55 + 0.9 * (noise(r * 0.9, arm * 5.7, 2.2) * 0.5 + 0.5));
  const scaleHeight = (r: number) => 0.12 + 0.35 * Math.exp(-r / 1.8);
  const pickArm = () => {
    const x = random();
    return x < arms[0].weight ? 0 : x < arms[0].weight + arms[1].weight ? 1 : 2;
  };

  const anchors = somas.map((s) =>
    s === core
      ? { arm: 0, r: 0 }
      : { arm: pickArm(), r: R * (s.hub ? 0.3 + 0.4 * random() : 0.15 + 0.85 * Math.sqrt(random())) },
  );
  const streamLength = somas.map((s) => (s.hub ? 2.2 : 0.8 + s.weight * 2.2));

  const positions = new Float32Array(count * 3);
  const stars = new Float32Array(count * 4);
  const delays = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const role = roles[i];
    const group = groups[i];
    const t = pulses[i * 4 + 2];
    const soma = group >= 0 ? somas[group] : null;

    let r: number;
    let theta = random() * Math.PI * 2;
    let h: number;
    let boost: number;
    let halo: Vec3 | null = null;

    if (soma === core) {
      // Bulge: a soft, flattened swarm around the nucleus.
      r = role === ROLE.nucleus ? 0 : Math.abs(gaussian(random)) * (0.25 + 0.9 * t);
      h = role === ROLE.nucleus ? 0 : gaussian(random) * 0.4 * (0.3 + t);
      boost = role === ROLE.nucleus ? 4 : 2.2;
    } else if (soma) {
      const anchor = anchors[group];
      if (role === ROLE.dendrite) {
        const along = (random() < 0.5 ? -1 : 1) * t * streamLength[group];
        r = Math.max(0.2, anchor.r + along + gaussian(random) * 0.25);
        theta = armAngle(anchor.arm, r) + (gaussian(random) * armWidth(anchor.arm, r)) / r;
        h = gaussian(random) * scaleHeight(r);
        boost = 1.3;
      } else if (role === ROLE.body) {
        r = Math.max(0.2, anchor.r + gaussian(random) * 0.12);
        theta = armAngle(anchor.arm, r) + (gaussian(random) * 0.12) / r;
        h = gaussian(random) * 0.08;
        boost = 1.6;
      } else {
        r = Math.max(0.2, anchor.r);
        theta = armAngle(anchor.arm, r);
        h = 0;
        boost = soma.hub ? 3 : 2.2;
      }
    } else {
      const roll = random();
      if (roll < 0.55) {
        // Disc field stars, thinning outward, mostly tracing the arms.
        r = R * Math.min(1.25, -Math.log(1 - random() * 0.97) * 0.38);
        if (random() < 0.45) {
          const arm = pickArm();
          theta = armAngle(arm, r) + (gaussian(random) * armWidth(arm, r) * 1.6) / Math.max(r, 0.3);
        }
        h = gaussian(random) * scaleHeight(r) * 1.4;
        boost = 2.6;
      } else if (roll < 0.8) {
        r = Math.abs(gaussian(random)) * 1.1;
        h = gaussian(random) * 0.6;
        boost = 2.4;
      } else {
        // Sparse halo around the whole disc.
        const d: Vec3 = normalize([gaussian(random), gaussian(random), gaussian(random)]);
        const reach = R * 1.3 * Math.cbrt(random());
        halo = [cx + d[0] * reach, cy + d[1] * reach, cz + d[2] * reach];
        r = reach;
        h = 0;
        boost = 1.2;
      }
    }

    let x: number;
    let y: number;
    let z: number;
    if (halo) {
      [x, y, z] = halo;
    } else {
      const c = Math.cos(theta) * r;
      const s = Math.sin(theta) * r;
      x = cx + u[0] * c + v[0] * s + axis[0] * h;
      y = cy + u[1] * c + v[1] * s + axis[1] * h;
      z = cz + u[2] * c + v[2] * s + axis[2] * h;
    }
    // Nothing in nature is a clean spiral: a gentle noise warp over the whole disc.
    const wx = noise(x * 0.15, y * 0.15, z * 0.15 + 9) * 0.6 + noise(x * 0.6, y * 0.6, z * 0.6 + 2) * 0.15;
    const wy = noise(x * 0.15 + 17, y * 0.15, z * 0.15) * 0.6 + noise(x * 0.6 + 5, y * 0.6, z * 0.6) * 0.15;
    const wz = noise(x * 0.15, y * 0.15 + 31, z * 0.15) * 0.6 + noise(x * 0.6, y * 0.6 + 8, z * 0.6) * 0.15;
    positions[i * 3] = x + wx;
    positions[i * 3 + 1] = y + wy;
    positions[i * 3 + 2] = z + wz;

    const radial = r / R;
    const color = soma?.hub ? mix(EMBER, PALE, 0.35) : mix(BULGE, YOUNG, smoothstep(0.06, 0.45, radial));
    stars[i * 4] = color[0];
    stars[i * 4 + 1] = color[1];
    stars[i * 4 + 2] = color[2];
    stars[i * 4 + 3] = boost;

    delays[i] = Math.min(1, radial * 0.55 + random() * 0.45);
  }

  return { positions, stars, delays };
}
