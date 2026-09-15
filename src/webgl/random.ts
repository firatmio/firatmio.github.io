/** Deterministic PRNG (mulberry32) so the network grows the same way on every load. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximate standard normal sample (Irwin–Hall, 4 terms). */
export function gaussian(random: () => number): number {
  return (random() + random() + random() + random() - 2) * 1.7320508;
}
