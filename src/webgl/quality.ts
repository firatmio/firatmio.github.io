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

/** Whether this browser can run the scenes at all — three.js needs WebGL 2. */
export function supportsWebGL2(): boolean {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

/** Seconds of frames judged at once. */
const WINDOW = 2;
/** Below this the resolution steps down… */
const SLOW_FPS = 45;
/** …and above this, held for a few windows running, it steps back up. */
const SMOOTH_FPS = 57;
const CALM_WINDOWS = 3;

/**
 * Keeps the frame rate up by trading resolution for it. Every couple of seconds it looks at
 * how long the frames took: when they ran slow it steps the pixel ratio down, and once
 * there's headroom again it steps back up towards the device's own. Particle counts stay
 * fixed — the fill cost of the glowing dust and the bloom is what moves.
 */
export class ResolutionGovernor {
  ratio: number;
  private readonly min: number;
  private time = 0;
  private frames = 0;
  private calm = 0;

  constructor(private readonly max: number) {
    this.ratio = max;
    this.min = Math.min(max, 0.75);
  }

  /** Feed each frame's duration; returns the new pixel ratio when it changes, else `null`. */
  sample(delta: number): number | null {
    // A background tab or a one-off hitch says nothing about sustained load.
    if (delta <= 0 || delta >= 0.1 || document.hidden) return null;
    this.time += delta;
    this.frames++;
    if (this.time < WINDOW) return null;
    const fps = this.frames / this.time;
    this.time = 0;
    this.frames = 0;

    if (fps < SLOW_FPS && this.ratio > this.min) {
      this.calm = 0;
      return this.set(this.ratio * 0.8);
    }
    if (fps > SMOOTH_FPS && this.ratio < this.max) {
      if (++this.calm < CALM_WINDOWS) return null;
      this.calm = 0;
      return this.set(this.ratio * 1.15);
    }
    this.calm = 0;
    return null;
  }

  private set(ratio: number): number {
    this.ratio = Math.round(Math.min(this.max, Math.max(this.min, ratio)) * 100) / 100;
    return this.ratio;
  }
}
