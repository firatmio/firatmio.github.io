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

/**
 * The journey's landmarks, for the map in the corner: where a click on each node carries
 * the scroll. Deliberately unlabelled on screen — the map is there to be discovered.
 */
export const JOURNEY_STOPS = [
  { name: "Signature", at: STAGES.signature },
  { name: "Projects", at: STAGES.hero },
  { name: "About", at: STAGES.enter },
  { name: "Galaxy", at: STAGES.galaxy },
  { name: "Quacomes", at: STAGES.sand },
  { name: "Contact", at: STAGES.finale },
] as const;

/**
 * Past the end the journey loops. Pushed on past the contact logos, they burst one after
 * another; then all the dust gathers back into the signature, and at `end` — the same
 * frame as the very start — the page quietly jumps back to the top. Progress runs 0..end.
 */
export const LOOP = { explodeStart: 1.008, explodeEnd: 1.06, gatherStart: 1.052, end: 1.14 } as const;

/** Visibility of the contact logos' links while the logos stand formed, 0..1. */
export function contactReveal(progress: number): number {
  return (
    smoothstep(CONTACT_LOGOS.end - 0.012, CONTACT_LOGOS.end + 0.008, progress) *
    (1 - smoothstep(LOOP.explodeStart - 0.004, LOOP.explodeStart + 0.004, progress))
  );
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
