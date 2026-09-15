import { createNoise3D } from "simplex-noise";
import { AZURE, EMBER, PALE, mix, type RGB } from "../palette";
import { createRandom, gaussian } from "../random";
import type { Timing } from "../particles/buffers";
import type { Soma } from "../particles/targets/neuron";

export interface SynapseCurve {
  /** flat xyz polyline, source soma → target soma */
  points: Float32Array;
  length: number;
  /** css px */
  halfWidth: number;
  brightness: number;
  color: RGB;
  /** The source neuron's rhythm — signals leave when it fires. */
  timing: Timing;
  /** Seconds for a signal to cross the fibre. */
  travel: number;
  seed: number;
}

const SIGNAL_SPEED = 1.15; // world units per second
const SAMPLE_SPACING = 0.04;

/**
 * Wires somas together with gently bent nerve fibres: every project hub reaches for its
 * nearest fellow hub, and every neuron links to a few (irregularly many) neighbours.
 */
export function connectSomas(somas: Soma[], seed = 4242): SynapseCurve[] {
  const random = createRandom(seed);
  const noise = createNoise3D(random);
  const curves: SynapseCurve[] = [];
  const linked = new Set<string>();

  // Depth counts extra so fibres mostly run within a layer of tissue.
  const distance = (a: Soma, b: Soma) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 1.3);

  const buildCurve = (a: Soma, b: Soma): SynapseCurve | null => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const d = Math.hypot(dx, dy, dz);
    const span = d - (a.radius + b.radius) * 1.1;
    if (span < 0.1) return null;
    const ux = dx / d;
    const uy = dy / d;
    const uz = dz / d;
    // In-plane perpendicular: fibres bow sideways on screen, not towards the camera.
    let px = -uy;
    let py = ux;
    const pl = Math.hypot(px, py);
    if (pl < 1e-4) {
      px = 1;
      py = 0;
    } else {
      px /= pl;
      py /= pl;
    }

    const sx = a.x + ux * a.radius * 1.1;
    const sy = a.y + uy * a.radius * 1.1;
    const sz = a.z + uz * a.radius * 1.1;
    const ex = b.x - ux * b.radius * 1.1;
    const ey = b.y - uy * b.radius * 1.1;
    const ez = b.z - uz * b.radius * 1.1;

    // Independent bends at each control point give C- and S-shaped fibres alike.
    const bend1 = Math.max(-0.5, Math.min(0.5, gaussian(random) * 0.28)) * span;
    const bend2 = Math.max(-0.5, Math.min(0.5, gaussian(random) * 0.28)) * span;
    const c1x = sx + ux * span * 0.3 + px * bend1;
    const c1y = sy + uy * span * 0.3 + py * bend1;
    const c1z = sz + uz * span * 0.3 + (random() - 0.5) * 0.2 * span;
    const c2x = sx + ux * span * 0.7 + px * bend2;
    const c2y = sy + uy * span * 0.7 + py * bend2;
    const c2z = sz + uz * span * 0.7 + (random() - 0.5) * 0.2 * span;

    const samples = Math.max(12, Math.min(120, Math.round(span / SAMPLE_SPACING)));
    const points = new Float32Array((samples + 1) * 3);
    const offset = random() * 100;
    let length = 0;
    for (let k = 0; k <= samples; k++) {
      const t = k / samples;
      const mt = 1 - t;
      const w0 = mt * mt * mt;
      const w1 = 3 * mt * mt * t;
      const w2 = 3 * mt * t * t;
      const w3 = t * t * t;
      let x = w0 * sx + w1 * c1x + w2 * c2x + w3 * ex;
      let y = w0 * sy + w1 * c1y + w2 * c2y + w3 * ey;
      let z = w0 * sz + w1 * c1z + w2 * c2z + w3 * ez;
      // A living fibre is never a clean curve: small noise wobble, pinned at both ends.
      const envelope = Math.sin(Math.PI * t);
      const wobble = noise(x * 1.1 + offset, y * 1.1, z * 1.1) * 0.05 * span * envelope;
      x += px * wobble;
      y += py * wobble;
      z += noise(x * 1.1, y * 1.1 + offset, z * 1.1) * 0.03 * span * envelope;
      points[k * 3] = x;
      points[k * 3 + 1] = y;
      points[k * 3 + 2] = z;
      if (k > 0) {
        length += Math.hypot(x - points[k * 3 - 3], y - points[k * 3 - 2], z - points[k * 3 - 1]);
      }
    }

    const hub = a.hub || b.hub;
    return {
      points,
      length,
      halfWidth: hub ? 0.9 : 0.6 + Math.min(1, Math.max(a.weight, b.weight)) * 0.5,
      brightness: hub ? 0.14 : 0.07 + 0.09 * Math.min(1, a.weight + b.weight),
      color: a.hub ? mix(EMBER, PALE, 0.3) : b.hub ? mix(AZURE, EMBER, 0.5) : mix(AZURE, PALE, 0.35),
      timing: a.timing,
      travel: Math.min(length / SIGNAL_SPEED, (a.timing.period - 0.4) * 0.85),
      seed: random(),
    };
  };

  const link = (from: number, to: number): boolean => {
    const key = from < to ? `${from}:${to}` : `${to}:${from}`;
    if (from === to || linked.has(key)) return false;
    linked.add(key);
    const curve = buildCurve(somas[from], somas[to]);
    if (curve) curves.push(curve);
    return curve !== null;
  };

  // Backbone: every project hub reaches for its nearest fellow hub.
  const hubIndices = somas.flatMap((s, i) => (s.hub ? [i] : []));
  for (const i of hubIndices) {
    let nearest = -1;
    let nearestDistance = Infinity;
    for (const j of hubIndices) {
      if (j === i) continue;
      const d = distance(somas[i], somas[j]);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = j;
      }
    }
    if (nearest >= 0) link(i, nearest);
  }

  // Local wiring with irregular degree — some neurons stay isolated, some are chatty.
  somas.forEach((soma, i) => {
    const degree = soma.hub
      ? 3 + Math.floor(random() * 3)
      : random() < 0.3
        ? 0
        : 1 + Math.floor(random() * (1 + soma.weight * 3));
    if (degree === 0) return;
    const reach = soma.hub ? 3.2 : 2 + soma.weight * 2;
    const candidates = somas
      .map((other, j) => ({ j, d: distance(soma, other) }))
      .filter((c) => c.j !== i && c.d < reach)
      .sort((p, q) => p.d - q.d);
    let made = 0;
    for (const c of candidates) {
      if (made >= degree) break;
      if (random() < 0.35) continue;
      if (link(i, c.j)) made++;
    }
  });

  return curves;
}
