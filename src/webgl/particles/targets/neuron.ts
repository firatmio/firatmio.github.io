import { createNoise3D } from "simplex-noise";
import { AZURE, EMBER, PALE, TEAL, VIOLET, mix, type RGB } from "../../palette";
import { createRandom, gaussian } from "../../random";
import { ParticleWriter, ROLE, type ParticleBuffers, type Timing } from "../buffers";

export interface HubSpec {
  slug: string;
  /** 0..1 prominence */
  weight: number;
  featured?: boolean;
}

export interface NeuronMapOptions {
  budget: number;
  camera: { z: number; fov: number; aspect: number };
  hubs: HubSpec[];
  seed?: number;
}

export interface NeuronHub {
  slug: string;
  position: [number, number, number];
  radius: number;
}

export interface Soma {
  x: number;
  y: number;
  z: number;
  /** 0..1 for decorative, 1..1.5 for project hubs */
  weight: number;
  radius: number;
  hub: boolean;
  timing: Timing;
}

export interface NeuronMap {
  particles: ParticleBuffers;
  hubs: NeuronHub[];
  somas: Soma[];
  /** The neuron the camera dives into for the About stop. */
  core: Soma;
  /** Unit directions in which that neuron's dendrites leave its soma. */
  coreBranches: [number, number, number][];
}

interface Fibre {
  soma: Soma;
  /** flat xyz polyline */
  points: number[];
  /** distance from the soma along the arbor, 0..1, per vertex */
  t: number[];
  thickness: number;
}

/** Dust has no neuron: it twinkles on its own clock. */
const FREE: Timing = { period: 0, phase: 0, reliability: 0 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Grows an organic neuron map: project hubs and decorative somas scattered over a
 * domain-warped density field, each sprouting noise-steered dendrite arbors that are
 * then dusted with particles. No grids, no spheres, no straight segments.
 */
export function generateNeuronMap(options: NeuronMapOptions): NeuronMap {
  const { budget, camera, hubs: hubSpecs, seed = 1729 } = options;
  const random = createRandom(seed);
  const noise = createNoise3D(random);

  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  const halfH = (z: number) => (camera.z - z) * tanHalf;
  const halfW = (z: number) => halfH(z) * camera.aspect;

  const fbm = (x: number, y: number, z: number) => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 3; o++) {
      sum += amp * noise(x * freq, y * freq, z * freq);
      amp *= 0.5;
      freq *= 2.03;
    }
    return sum;
  };

  // Domain-warped density: clumps and filaments rather than an even spread.
  const density = (x: number, y: number, z: number) => {
    const wx = noise(x * 0.21 + 5.2, y * 0.21, z * 0.21) * 1.8;
    const wy = noise(x * 0.21, y * 0.21 + 9.7, z * 0.21) * 1.8;
    return clamp01(fbm(x * 0.32 + wx, y * 0.32 + wy, z * 0.32) * 0.75 + 0.5);
  };

  // Slow spatial colour drift so regions of tissue read slightly differently.
  const tissueTone = (x: number, y: number, z: number): RGB => {
    const a = noise(x * 0.11, y * 0.11, z * 0.11 + 3.3) * 0.5 + 0.5;
    const b = noise(x * 0.17 + 8.1, y * 0.17, z * 0.17) * 0.5 + 0.5;
    return mix(mix(AZURE, VIOLET, a), TEAL, b * b * 0.45);
  };

  // ---------------------------------------------------------------- somas

  const somas: Soma[] = [];
  const hubs: NeuronHub[] = [];

  const ordered = [...hubSpecs].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || b.weight - a.weight,
  );

  for (const spec of ordered) {
    let best: Soma | null = null;
    let bestScore = -Infinity;
    for (let k = 0; k < 48; k++) {
      const z = Math.max(-1.4, Math.min(1.0, gaussian(random) * 0.55));
      const spanX = spec.featured ? 0.22 : 0.7;
      const spanY = spec.featured ? 0.24 : 0.6;
      const x = (random() * 2 - 1) * halfW(z) * spanX;
      const y = (random() * 2 - 1) * halfH(z) * spanY;
      // Spread hubs out in screen space, prefer denser tissue.
      let spread = 1.2;
      for (const h of somas) {
        const dx = (x - h.x) / halfW(0);
        const dy = (y - h.y) / halfH(0);
        spread = Math.min(spread, Math.hypot(dx, dy));
      }
      const score = spread + density(x, y, z) * 0.25 + random() * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = {
          x,
          y,
          z,
          weight: 1 + spec.weight * 0.5,
          radius: 0.12 + spec.weight * 0.1,
          hub: true,
          timing: { period: 0, phase: 0, reliability: 0.55 },
        };
      }
    }
    // Hubs beat slowly and steadily, like a resting heart.
    best!.timing.period = 4.2 + random() * 2.4;
    best!.timing.phase = random();
    somas.push(best!);
    hubs.push({ slug: spec.slug, position: [best!.x, best!.y, best!.z], radius: best!.radius * 2.2 });
  }

  const decorativeCount = Math.round(Math.min(140, Math.max(40, budget / 550)));
  for (let attempts = 0; somas.length < hubs.length + decorativeCount && attempts < 20000; attempts++) {
    const z = -7 + random() * 9.5;
    const x = (random() * 2 - 1) * halfW(z) * 1.08;
    const y = (random() * 2 - 1) * halfH(z) * 1.08;
    if (density(x, y, z) < 0.42 + random() * 0.35) continue;
    let tooClose = false;
    for (const s of somas) {
      const minDist = s.hub ? s.radius * 6 : 0.4;
      if ((x - s.x) ** 2 + (y - s.y) ** 2 + (z - s.z) ** 2 < minDist * minDist) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    const weight = 0.1 + 0.6 * Math.pow(random(), 2.2);
    somas.push({
      x,
      y,
      z,
      weight,
      radius: 0.04 + weight * 0.1,
      hub: false,
      timing: { period: 3.5 + Math.pow(random(), 0.8) * 8.5, phase: random(), reliability: 0 },
    });
  }

  // A sizeable, central, non-project soma with clear space around it, so the camera's
  // approach doesn't graze a hub. Picked without consuming randomness: the rest of the
  // map grows exactly as it would otherwise.
  const hubSomas = somas.filter((s) => s.hub);
  let core = somas.find((s) => !s.hub) ?? somas[0];
  let coreScore = -Infinity;
  for (const s of somas) {
    if (s.hub || s.z < -1.5 || s.z > 1) continue;
    const clearance = Math.min(...hubSomas.map((h) => Math.hypot(s.x - h.x, s.y - h.y, s.z - h.z)));
    if (clearance < 1.2) continue;
    // Prefer room around it too: a hub right outside the membrane looms as huge blobs
    // once the camera is inside.
    const score = s.weight * 1.5 - Math.hypot(s.x / halfW(0), s.y / halfH(0)) + Math.min(clearance, 4) * 0.6;
    if (score > coreScore) {
      coreScore = score;
      core = s;
    }
  }

  // --------------------------------------------------------------- arbors

  const fibres: Fibre[] = [];
  const STEP = 0.06;

  const grow = (
    soma: Soma,
    start: [number, number, number],
    dir: [number, number, number],
    length: number,
    depth: number,
    t0: number,
    thickness: number,
  ) => {
    let [x, y, z] = start;
    let [dx, dy, dz] = dir;
    // Remember where the branch set out for, so it keeps radiating instead of curling up.
    const heading = Math.hypot(dx, dy) || 1;
    const hx = dx / heading;
    const hy = dy / heading;
    const steps = Math.max(5, Math.round(length / STEP));
    const fibre: Fibre = { soma, points: [x, y, z], t: [t0], thickness };
    fibres.push(fibre);

    for (let s = 1; s <= steps; s++) {
      // Bend along a shared noise field so neighbouring fibres drift alike, plus a
      // little private wander so no two are identical.
      const k = 0.85;
      dx += noise(x * k + 13.1, y * k, z * k) * 0.32 + (random() - 0.5) * 0.14 + hx * 0.12;
      dy += noise(x * k, y * k + 47.7, z * k) * 0.32 + (random() - 0.5) * 0.14 + hy * 0.12;
      dz = dz * 0.8 + noise(x * k, y * k, z * k + 91.3) * 0.12 + (random() - 0.5) * 0.06;
      const len = Math.hypot(dx, dy, dz) || 1;
      dx /= len;
      dy /= len;
      dz /= len;
      const step = STEP * (0.75 + random() * 0.5);
      x += dx * step;
      y += dy * step;
      z += dz * step;
      const t = t0 + (1 - t0) * (s / steps);
      fibre.points.push(x, y, z);
      fibre.t.push(t);

      if (depth < 2 && s > 2 && s < steps - 2 && random() < 0.07) {
        const remaining = length * (1 - s / steps);
        const side = random() < 0.5 ? -1 : 1;
        const spread = 0.5 + random() * 0.7;
        grow(
          soma,
          [x, y, z],
          [dx - dy * side * spread, dy + dx * side * spread, dz + (random() - 0.5) * 0.3],
          remaining * (0.5 + random() * 0.4),
          depth + 1,
          t,
          thickness * 0.7,
        );
      }
    }
  };

  const coreBranches: [number, number, number][] = [];
  for (const soma of somas) {
    const branches = soma.hub
      ? 6 + Math.floor(random() * 5)
      : 3 + Math.floor(soma.weight * 5 + random() * 2);
    for (let b = 0; b < branches; b++) {
      const theta = random() * Math.PI * 2;
      const dir: [number, number, number] = [Math.cos(theta), Math.sin(theta), (random() - 0.5) * 0.5];
      if (soma === core) {
        const l = Math.hypot(...dir);
        coreBranches.push([dir[0] / l, dir[1] / l, dir[2] / l]);
      }
      const length = soma.hub
        ? halfH(soma.z) * (0.3 + random() * 0.3) * (0.8 + (soma.weight - 1) * 0.6)
        : (0.5 + soma.weight * 2.2) * (0.6 + random() * 0.8);
      const start: [number, number, number] = [
        soma.x + dir[0] * soma.radius * 0.8,
        soma.y + dir[1] * soma.radius * 0.8,
        soma.z + dir[2] * soma.radius * 0.8,
      ];
      grow(soma, start, dir, length, 0, 0, soma.hub ? 0.035 : 0.022);
    }
  }

  // ------------------------------------------------------------ particles

  const writer = new ParticleWriter(budget);

  // Nuclei first so they always make it into the buffer.
  somas.forEach((soma, group) => {
    writer.push({
      x: soma.x,
      y: soma.y,
      z: soma.z,
      size: soma.hub ? 0.24 + (soma.weight - 1) * 0.3 : 0.06 + soma.weight * 0.2,
      brightness: soma.hub ? 1.8 + (soma.weight - 1) * 1.6 : 0.35 + soma.weight * 1.1,
      color: soma.hub ? mix(EMBER, PALE, 0.25) : mix(tissueTone(soma.x, soma.y, soma.z), PALE, 0.55),
      seed: random(),
      timing: soma.timing,
      arbor: 0,
      group,
      role: ROLE.nucleus,
    });
  });

  // Soma bodies: noise-deformed blobs, denser towards the centre.
  const bodyBudget = budget * 0.1;
  const weightSum = somas.reduce((acc, s) => acc + s.weight * (s.hub ? 3 : 1), 0);
  somas.forEach((soma, group) => {
    const count = Math.round((bodyBudget * soma.weight * (soma.hub ? 3 : 1)) / weightSum);
    const base = soma.hub ? EMBER : tissueTone(soma.x, soma.y, soma.z);
    const offset = random() * 100;
    for (let i = 0; i < count; i++) {
      let ux = gaussian(random);
      let uy = gaussian(random);
      let uz = gaussian(random);
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul;
      uy /= ul;
      uz /= ul;
      const lump = 1 + 0.45 * noise(ux * 1.7 + offset, uy * 1.7, uz * 1.7);
      const r = soma.radius * Math.cbrt(random()) * lump;
      const falloff = 1 - r / (soma.radius * 1.45);
      writer.push({
        x: soma.x + ux * r,
        y: soma.y + uy * r,
        z: soma.z + uz * r * 0.7,
        size: (0.018 + random() * 0.022) * (soma.hub ? 1.3 : 1),
        brightness: (0.25 + falloff * 0.6) * (soma.hub ? 1.4 : 1),
        color: mix(base, PALE, falloff * 0.5),
        seed: random(),
        timing: soma.timing,
        arbor: (1 - falloff) * 0.1,
        group,
        role: ROLE.body,
      });
    }
  });

  // Dendrites: scatter particles along the arbors, thinning towards the tips.
  const dendriteBudget = budget * 0.66;
  let totalLength = 0;
  for (const f of fibres) {
    for (let i = 3; i < f.points.length; i += 3) {
      totalLength += Math.hypot(
        f.points[i] - f.points[i - 3],
        f.points[i + 1] - f.points[i - 2],
        f.points[i + 2] - f.points[i - 1],
      );
    }
  }
  const spacing = totalLength / dendriteBudget;

  const somaIndex = new Map(somas.map((s, i) => [s, i]));
  for (const f of fibres) {
    const soma = f.soma;
    const group = somaIndex.get(soma)!;
    for (let i = 3; i < f.points.length; i += 3) {
      const ax = f.points[i - 3];
      const ay = f.points[i - 2];
      const az = f.points[i - 1];
      const bx = f.points[i];
      const by = f.points[i + 1];
      const bz = f.points[i + 2];
      const segLength = Math.hypot(bx - ax, by - ay, bz - az);
      const n = Math.floor(segLength / spacing + random());
      const ta = f.t[i / 3 - 1];
      const tb = f.t[i / 3];
      for (let p = 0; p < n; p++) {
        const u = random();
        const t = ta + (tb - ta) * u;
        const spread = f.thickness * (1 - 0.6 * t);
        const x = ax + (bx - ax) * u + gaussian(random) * spread;
        const y = ay + (by - ay) * u + gaussian(random) * spread;
        const z = az + (bz - az) * u + gaussian(random) * spread * 0.6;
        const tissue = tissueTone(x, y, z);
        const tone = soma.hub ? mix(EMBER, tissue, clamp01(t * 1.6)) : tissue;
        let size = 0.02 * (1.25 - 0.7 * t) * (0.6 + random() * 0.8) * (soma.hub ? 1.2 : 1);
        let bright = (soma.hub ? 0.8 : 0.35 + soma.weight * 0.6) * (1 - 0.7 * t) * (0.5 + random() * 0.7);
        // Occasional varicosities — beads along the fibre.
        if (random() < 0.015) {
          size *= 2.6;
          bright *= 2.4;
        }
        const written = writer.push({
          x,
          y,
          z,
          size,
          brightness: bright,
          color: tone,
          seed: random(),
          timing: soma.timing,
          arbor: t,
          group,
          role: ROLE.dendrite,
        });
        if (!written) break;
      }
    }
  }

  // Interstitial dust fills whatever budget is left — faint, loosely clustered.
  for (let attempts = 0; !writer.full && attempts < budget * 20; attempts++) {
    const z = -13 + random() * 15.5;
    const x = (random() * 2 - 1) * halfW(z) * 1.2;
    const y = (random() * 2 - 1) * halfH(z) * 1.2;
    const d = density(x, y, z);
    if (d < random() * 0.95) continue;
    const spark = random() < 0.02;
    writer.push({
      x,
      y,
      z,
      size: (0.008 + random() * 0.014) * (spark ? 2.2 : 1),
      brightness: (0.06 + d * 0.22) * (spark ? 3.5 : 1),
      color: mix(tissueTone(x, y, z), PALE, spark ? 0.6 : 0.2),
      seed: random(),
      timing: FREE,
      arbor: 0,
      group: -1,
      role: ROLE.dust,
    });
  }

  return { particles: writer.finish(), hubs, somas, core, coreBranches };
}
