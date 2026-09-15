import { createNoise3D } from "simplex-noise";
import { createRandom } from "../../random";

export interface BrainWarp {
  /** Where a point of the neuron map sits once the tissue has become "brain". */
  at(x: number, y: number, z: number): [number, number, number];
  /** How long (0..1 of the transition window) a point waits before moving. */
  delay(x: number, y: number, z: number): number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * The brain state as a smooth spatial warp of the neuron map. Because it depends on
 * position alone, particles and synapse fibres pass through it identically and stay
 * attached to one another while the tissue reshapes.
 */
export function createBrainWarp(options: {
  camera: { z: number; fov: number; aspect: number };
  core: { x: number; y: number; z: number };
  seed?: number;
}): BrainWarp {
  const { camera, core, seed = 97 } = options;
  const noise = createNoise3D(createRandom(seed));
  const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
  const halfH = (z: number) => (camera.z - z) * tanHalf;
  const halfW = (z: number) => halfH(z) * camera.aspect;

  return {
    at(x, y, z) {
      const dx = x - core.x;
      const dy = y - core.y;
      const dz = z - core.z;
      // Leave the About neuron's neighbourhood be — the camera is still close by.
      const reach = smoothstep(0.6, 3.5, Math.hypot(dx, dy, dz));

      // Cortical folding: the tissue buckles into slow, uneven layers.
      const fold = noise(x * 0.22, y * 0.22, 7.7) * 1.4 + noise(x * 0.55 + 3.1, y * 0.55, 1.1) * 0.4;
      let bx = x + noise(x * 0.3 + 11, y * 0.3, z * 0.3) * 0.5 * reach;
      let by = y + noise(x * 0.3, y * 0.3 + 23, z * 0.3) * 0.5 * reach;
      let bz = z + fold * reach;

      // The map was grown to fill the hero frame; fray that rectangular edge into ragged
      // tendrils so the tissue has no border once the camera pulls back.
      const edge = smoothstep(0.55, 1.2, Math.max(Math.abs(x / halfW(z)), Math.abs(y / halfH(z))));
      if (edge > 0) {
        const planar = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx);
        const push = edge * (1.2 + 3.2 * (noise(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 5.3) * 0.5 + 0.5));
        bx += (dx / planar) * push;
        by += (dy / planar) * push;
        bz += edge * noise(x * 0.4, y * 0.4, 13.7) * 2;
      }
      return [bx, by, bz];
    },

    delay(x, y, z) {
      return noise(x * 0.15, y * 0.15, z * 0.15 + 40) * 0.5 + 0.5;
    },
  };
}
