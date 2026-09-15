import { smoothstep } from "./math";

/**
 * Scroll progress (0..1) at which the journey reaches each stop. Shared by the camera
 * path and the shaders so framing and scene state never drift apart.
 */
export const STAGES = {
  /** The opening "FTA" signature in particles. */
  signature: 0,
  /** The neuron network, fully grown — its project neurons are clickable here. */
  hero: 0.077,
  approach: 0.169,
  enter: 0.246,
  // The camera lingers inside the About neuron long enough for every About beat.
  about: 0.446,
  brain: 0.538,
  galaxy: 0.677,
  sand: 0.797,
  // Up from the grains to a night desert under the stars — the contact stop.
  desert: 0.908,
  finale: 1,
} as const;

/** Neurons are clickable only while the grown network is framed. */
export function heroInteractive(progress: number): boolean {
  return Math.abs(progress - STAGES.hero) < 0.015;
}

/** The Quacomes mark on the sand links out while it stands fully formed. */
export function markInteractive(progress: number): boolean {
  return progress > STAGES.sand - 0.004 && progress < STAGES.sand + 0.014;
}

/**
 * The stretch of scroll over which the closing sky's stars gather into the contact logos;
 * formed, they hold from `end` to the finale.
 */
export const CONTACT_LOGOS = { start: STAGES.desert + 0.022, end: 0.972 } as const;

/** Visibility of the contact logos' links as the logos finish forming, 0..1. */
export function contactReveal(progress: number): number {
  return smoothstep(CONTACT_LOGOS.end - 0.012, CONTACT_LOGOS.end + 0.008, progress);
}

/** The About text is told in this many beats while the camera rests inside the neuron. */
export const ABOUT_BEATS = 4;

/** How far the About neuron has swollen around the camera, 0..1. */
export function interiorPresence(progress: number): number {
  return (
    smoothstep(STAGES.approach + 0.025, STAGES.enter - 0.008, progress) *
    (1 - smoothstep(STAGES.about + 0.017, STAGES.about + 0.083, progress))
  );
}

/** Backdrop behind the About text: up for as long as any beat is showing, 0..1. */
export function aboutReveal(progress: number): number {
  return (
    smoothstep(STAGES.enter - 0.025, STAGES.enter + 0.008, progress) *
    (1 - smoothstep(STAGES.about, STAGES.about + 0.033, progress))
  );
}

/**
 * Where each About beat stands: -1 still to come, 0 on screen, 1 already passed. Beats
 * share the inside stay evenly; each eases in and out over 30% of its share.
 */
export function aboutBeats(progress: number): number[] {
  const start = STAGES.enter - 0.017;
  const end = STAGES.about + 0.025;
  const span = (end - start) / ABOUT_BEATS;
  const fade = span * 0.3;
  return Array.from({ length: ABOUT_BEATS }, (_, i) => {
    const from = start + i * span;
    const to = from + span;
    if (progress <= from + fade) return -(1 - smoothstep(from, from + fade, progress));
    return smoothstep(to - fade, to, progress);
  });
}
