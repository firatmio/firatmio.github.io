export interface Quality {
  tier: "low" | "mid" | "high";
  particles: number;
  pixelRatio: number;
}

/** Rough device tiering — the particle budget is the main cost lever. */
export function detectQuality(): Quality {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  if (coarse || Math.min(width, height) < 600) {
    return { tier: "low", particles: 24_000, pixelRatio: Math.min(dpr, 1.5) };
  }
  if (cores >= 8 && width * height >= 1280 * 720) {
    return { tier: "high", particles: 70_000, pixelRatio: Math.min(dpr, 2) };
  }
  return { tier: "mid", particles: 45_000, pixelRatio: Math.min(dpr, 1.5) };
}
