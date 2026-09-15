import { createNoise3D } from "simplex-noise";
import { AZURE, EMBER, PALE, TEAL, VIOLET, mix, type RGB } from "../palette";
import { createRandom, gaussian } from "../random";

export const INTERIOR_KIND = { membrane: 0, cytoplasm: 1, nucleus: 2, stream: 3 } as const;
type Kind = (typeof INTERIOR_KIND)[keyof typeof INTERIOR_KIND];

/** Particles of the About neuron's interior, in local units (membrane radius ≈ 1). */
export interface InteriorBuffers {
  count: number;
  positions: Float32Array;
  /** stream: bezier control point · nucleus: nucleus centre (for breathing) */
  controls: Float32Array;
  /** stream: end point on the membrane */
  ends: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  seeds: Float32Array;
  kinds: Float32Array;
}

type Vec3 = [number, number, number];

const ZERO: Vec3 = [0, 0, 0];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Grows the inside of a neuron: a lumpy membrane pierced where its dendrites leave the
 * cell, a nucleus at the very centre of the soma, drifting cytoplasm, and cargo streaming
 * from the nucleus out through the openings.
 *
 * @param openings unit directions of the neuron's own dendrites, so the fibres in the
 *   map visibly leave through the holes in the membrane.
 */
export function buildInterior(options: { budget: number; openings: Vec3[]; seed?: number }): InteriorBuffers {
  const { budget, seed = 2024 } = options;
  const random = createRandom(seed);
  const noise = createNoise3D(random);

  const buffers: InteriorBuffers = {
    count: 0,
    positions: new Float32Array(budget * 3),
    controls: new Float32Array(budget * 3),
    ends: new Float32Array(budget * 3),
    colors: new Float32Array(budget * 3),
    sizes: new Float32Array(budget),
    brightness: new Float32Array(budget),
    seeds: new Float32Array(budget),
    kinds: new Float32Array(budget),
  };
  let n = 0;
  const push = (p: Vec3, size: number, brightness: number, color: RGB, kind: Kind, control = ZERO, end = ZERO) => {
    if (n >= budget) return;
    buffers.positions.set(p, n * 3);
    buffers.controls.set(control, n * 3);
    buffers.ends.set(end, n * 3);
    buffers.colors.set(color, n * 3);
    buffers.sizes[n] = size;
    buffers.brightness[n] = brightness;
    buffers.seeds[n] = random();
    buffers.kinds[n] = kind;
    n++;
  };

  const unit = (): Vec3 => {
    const v: Vec3 = [gaussian(random), gaussian(random), gaussian(random)];
    const l = Math.hypot(...v) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const membraneRadius = (d: Vec3) =>
    1 + 0.16 * noise(d[0] * 1.4, d[1] * 1.4, d[2] * 1.4) + 0.05 * noise(d[0] * 4.3 + 7, d[1] * 4.3, d[2] * 4.3);
  const onMembrane = (d: Vec3, scale = 1): Vec3 => {
    const r = membraneRadius(d) * scale;
    return [d[0] * r, d[1] * r * 0.92, d[2] * r];
  };

  // Where the neuron's dendrites leave the cell: ragged holes in the membrane.
  const directions = options.openings.length > 0 ? options.openings : Array.from({ length: 4 }, unit);
  const openings = directions.map((dir) => ({ dir, radius: 0.2 + random() * 0.14 }));

  // ------------------------------------------------------------- membrane
  const membraneCount = Math.round(budget * 0.5);
  for (let made = 0, attempts = 0; made < membraneCount && attempts < membraneCount * 4; attempts++) {
    const d = unit();
    let rim = 0;
    let open = false;
    for (const o of openings) {
      const angle = Math.acos(Math.min(1, Math.max(-1, dot(d, o.dir))));
      const edge = o.radius * (0.8 + 0.4 * (noise(d[0] * 3, d[1] * 3, d[2] * 3 + 11) * 0.5 + 0.5));
      if (angle < edge) {
        open = true;
        break;
      }
      rim = Math.max(rim, 1 - Math.min(1, (angle - edge) / 0.12));
    }
    if (open) continue;
    const p = onMembrane(d, 1 + gaussian(random) * 0.012);
    const lipid = mix(AZURE, VIOLET, noise(d[0] * 2, d[1] * 2, d[2] * 2 + 3) * 0.5 + 0.5);
    push(
      p,
      (0.007 + random() * 0.009) * (1 + rim * 0.8),
      (0.14 + random() * 0.14) * (1 + rim * 2),
      mix(lipid, PALE, 0.3 + rim * 0.4),
      INTERIOR_KIND.membrane,
    );
    made++;
  }

  // -------------------------------------------------------------- nucleus
  // At the very centre of the soma, where the map's own nucleus hands over to it. Many
  // fine grains rather than a few big ones: seen this close, large sprites read as flakes.
  const NUCLEUS: Vec3 = [0, 0, 0];
  const nucleusCount = Math.round(budget * 0.2);
  for (let i = 0; i < nucleusCount; i++) {
    const d = unit();
    const lump = 1 + 0.3 * noise(d[0] * 1.8 + 20, d[1] * 1.8, d[2] * 1.8);
    const r = 0.16 * Math.cbrt(random()) * lump;
    const falloff = Math.max(0, 1 - r / 0.21);
    push(
      [d[0] * r, d[1] * r * 0.9, d[2] * r],
      0.004 + random() * 0.006,
      0.25 + falloff * 0.6,
      mix(mix(PALE, EMBER, 0.18), PALE, falloff * 0.5),
      INTERIOR_KIND.nucleus,
      NUCLEUS,
    );
  }
  // Nucleolus: a dense, bright kernel, slightly off-centre.
  const kernel: Vec3 = [0.04, -0.025, 0.015];
  const kernelCount = Math.round(budget * 0.02);
  for (let i = 0; i < kernelCount; i++) {
    const d = unit();
    const r = 0.04 * Math.cbrt(random());
    push(
      [kernel[0] + d[0] * r, kernel[1] + d[1] * r, kernel[2] + d[2] * r],
      0.006,
      1.2,
      mix(PALE, EMBER, 0.3),
      INTERIOR_KIND.nucleus,
      NUCLEUS,
    );
  }

  // ------------------------------------------------------------ cytoplasm
  const cytoplasmCount = Math.round(budget * 0.16);
  for (let made = 0, attempts = 0; made < cytoplasmCount && attempts < cytoplasmCount * 4; attempts++) {
    const d = unit();
    const r = 0.85 * Math.cbrt(random());
    if (r < 0.25) continue;
    const vesicle = random() < 0.08;
    push(
      [d[0] * r, d[1] * r, d[2] * r],
      vesicle ? 0.02 + random() * 0.02 : 0.004 + random() * 0.006,
      vesicle ? 0.12 : 0.1 + random() * 0.15,
      mix(TEAL, VIOLET, random()),
      INTERIOR_KIND.cytoplasm,
    );
    made++;
  }

  // -------------------------------------------------------------- streams
  // Cargo flowing from the nucleus out through each opening, along bowed paths.
  const streams = openings.map((o) => {
    const end = onMembrane(o.dir, 0.97);
    const l = Math.hypot(...end) || 1;
    const start: Vec3 = [(end[0] / l) * 0.16, (end[1] / l) * 0.16, (end[2] / l) * 0.16];
    const bow = unit();
    const control: Vec3 = [
      (start[0] + end[0]) / 2 + bow[0] * 0.22,
      (start[1] + end[1]) / 2 + bow[1] * 0.22,
      (start[2] + end[2]) / 2 + bow[2] * 0.22,
    ];
    return { start, control, end };
  });
  const jitter = (p: Vec3, amount: number): Vec3 => [
    p[0] + gaussian(random) * amount,
    p[1] + gaussian(random) * amount,
    p[2] + gaussian(random) * amount,
  ];
  while (n < budget) {
    const s = streams[Math.floor(random() * streams.length)];
    push(
      jitter(s.start, 0.02),
      0.006 + random() * 0.006,
      0.5 + random() * 0.5,
      mix(TEAL, PALE, 0.5),
      INTERIOR_KIND.stream,
      jitter(s.control, 0.04),
      jitter(s.end, 0.03),
    );
  }

  buffers.count = n;
  return buffers;
}
