import type { BrainWarp } from "./targets/brain";
import { buildDesertTargets, type LogoLayout } from "./targets/desert";
import { buildGalaxyTargets } from "./targets/galaxy";
import type { NeuronMap } from "./targets/neuron";
import { buildSandTargets } from "./targets/sand";
import { buildSignatureTargets } from "./targets/signature";
import type { Box } from "../signature/TrailField";

/** Alternative target positions for the same particles — one set per scene state. */
export interface StateBuffers {
  /** The opening "FTA" signature: xyz, brightness in w. */
  signature: Float32Array;
  /** World bounds of the signature's letters on their plane. */
  signatureBounds: Box;
  brain: Float32Array;
  galaxy: Float32Array;
  /** Galaxy-state colour (rgb) and brightness/size boost (w). */
  stars: Float32Array;
  sand: Float32Array;
  /** Sand-state lit colour (rgb) and grain size (w). */
  grains: Float32Array;
  /** Desert-state xyz; w packs each star's place in the finale's contact logos. */
  desert: Float32Array;
  /** Desert-state lit colour (rgb) and world size (w). */
  desertLooks: Float32Array;
  /** Per particle: its colour in the contact logos, 0 when it isn't in one (see DesertTargets). */
  logoTones: Float32Array;
  /** How the finale's contact logos are laid out. */
  logos: LogoLayout;
  /**
   * Per-particle wait before moving into brain, galaxy and sand (xyz, each 0..1); w packs
   * the desert kind (integer part) with its wait (fractional part).
   */
  morph: Float32Array;
  /** Corners of the Quacomes mark on the sand, in world space. */
  markCorners: [number, number, number][];
}

export function buildStates(
  map: NeuronMap,
  warp: BrainWarp,
  view: { fov: number; aspect: number; cameraZ: number; fontFamily: string },
): StateBuffers {
  const { particles } = map;
  const { count, positions } = particles;
  const brain = new Float32Array(count * 3);
  const morph = new Float32Array(count * 4);
  const signature = buildSignatureTargets(count, view);
  const galaxy = buildGalaxyTargets(particles, map.somas, map.core);
  const sand = buildSandTargets(count, view);
  const desert = buildDesertTargets(particles, map.somas, view);

  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    brain.set(warp.at(x, y, z), i * 3);
    morph[i * 4] = warp.delay(x, y, z);
    morph[i * 4 + 1] = galaxy.delays[i];
    morph[i * 4 + 2] = sand.delays[i];
    morph[i * 4 + 3] = desert.kinds[i];
  }

  return {
    signature: signature.positions,
    signatureBounds: signature.bounds,
    brain,
    galaxy: galaxy.positions,
    stars: galaxy.stars,
    sand: sand.positions,
    grains: sand.grains,
    desert: desert.positions,
    desertLooks: desert.looks,
    logoTones: desert.logoTones,
    logos: desert.logos,
    morph,
    markCorners: sand.markCorners,
  };
}
