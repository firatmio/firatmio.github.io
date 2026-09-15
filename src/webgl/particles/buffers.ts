/** Which part of a neuron a particle draws — decides where it goes in later scene states. */
export const ROLE = { nucleus: 0, body: 1, dendrite: 2, dust: 3 } as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export interface ParticleBuffers {
  count: number;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  seeds: Float32Array;
  /** period (s, 0 = free twinkle), phase, position along the arbor 0..1, reliability */
  pulses: Float32Array;
  /** CPU-only: index of the soma a particle belongs to, -1 for dust. */
  groups: Int32Array;
  /** CPU-only: see ROLE. */
  roles: Uint8Array;
}

/** Firing rhythm of the neuron a particle belongs to. */
export interface Timing {
  period: number;
  phase: number;
  /** Minimum firing strength — hubs beat steadily, decorative neurons are erratic. */
  reliability: number;
}

export interface ParticleSpec {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  color: readonly [number, number, number];
  seed: number;
  timing: Timing;
  /** Position along the neuron's arbor, 0 at the soma → 1 at the tips. */
  arbor: number;
  group: number;
  role: Role;
}

/** Fixed-capacity append-only writer for particle attribute arrays. */
export class ParticleWriter {
  private index = 0;
  private readonly buffers: ParticleBuffers;

  constructor(private readonly capacity: number) {
    this.buffers = {
      count: 0,
      positions: new Float32Array(capacity * 3),
      colors: new Float32Array(capacity * 3),
      sizes: new Float32Array(capacity),
      brightness: new Float32Array(capacity),
      seeds: new Float32Array(capacity),
      pulses: new Float32Array(capacity * 4),
      groups: new Int32Array(capacity),
      roles: new Uint8Array(capacity),
    };
  }

  get full(): boolean {
    return this.index >= this.capacity;
  }

  push(p: ParticleSpec): boolean {
    if (this.full) return false;
    const i = this.index++;
    const b = this.buffers;
    b.positions[i * 3] = p.x;
    b.positions[i * 3 + 1] = p.y;
    b.positions[i * 3 + 2] = p.z;
    b.colors[i * 3] = p.color[0];
    b.colors[i * 3 + 1] = p.color[1];
    b.colors[i * 3 + 2] = p.color[2];
    b.sizes[i] = p.size;
    b.brightness[i] = p.brightness;
    b.seeds[i] = p.seed;
    b.pulses[i * 4] = p.timing.period;
    b.pulses[i * 4 + 1] = p.timing.phase;
    b.pulses[i * 4 + 2] = p.arbor;
    b.pulses[i * 4 + 3] = p.timing.reliability;
    b.groups[i] = p.group;
    b.roles[i] = p.role;
    return true;
  }

  finish(): ParticleBuffers {
    this.buffers.count = this.index;
    return this.buffers;
  }
}
