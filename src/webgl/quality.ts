export interface Quality {
  tier: "low" | "mid" | "high";
  particles: number;
  pixelRatio: number;
  /** Pinned from the URL for a test — the resolution governor stays out of it. */
  fixedPixelRatio?: boolean;
}

/**
 * Device tiering, with overrides for testing on a real phone: `?count=12000` sets the
 * particle budget, `?pr=1` pins the pixel ratio.
 */
export function detectQuality(): Quality {
  const quality = detectTier();
  const params = new URLSearchParams(window.location.search);
  const count = Number(params.get("count"));
  if (count >= 1000) quality.particles = Math.min(Math.round(count), 200_000);
  const pr = Number(params.get("pr"));
  if (pr > 0) {
    quality.pixelRatio = Math.min(pr, 3);
    quality.fixedPixelRatio = true;
  }
  return quality;
}

/** Rough device tiering — the particle budget is the main cost lever. */
function detectTier(): Quality {
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
 *
 * Every step rebuilds the render targets, which is itself a hitch — so it must not swing
 * back and forth. A step up that couldn't hold becomes the ceiling it won't climb past
 * again (on a phone, a light stretch like the galaxy would otherwise keep baiting it up).
 */
export class ResolutionGovernor {
  ratio: number;
  private readonly min: number;
  /** The highest ratio worth trying — lowered whenever a step up had to be taken back. */
  private ceiling: number;
  /** The ratio before the last step up, until that step has held for a window. */
  private raisedFrom: number | null = null;
  private time = 0;
  private frames = 0;
  private calm = 0;

  constructor(private readonly max: number) {
    this.ratio = max;
    this.ceiling = max;
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
      if (this.raisedFrom !== null) this.ceiling = this.raisedFrom;
      this.raisedFrom = null;
      return this.set(this.ratio * 0.8);
    }
    // Whatever the last step up was, it has held.
    this.raisedFrom = null;
    if (fps > SMOOTH_FPS && this.ratio < this.ceiling) {
      if (++this.calm < CALM_WINDOWS) return null;
      this.calm = 0;
      this.raisedFrom = this.ratio;
      return this.set(Math.min(this.ceiling, this.ratio * 1.15));
    }
    this.calm = 0;
    return null;
  }

  private set(ratio: number): number {
    this.ratio = Math.round(Math.min(this.max, Math.max(this.min, ratio)) * 100) / 100;
    return this.ratio;
  }
}
