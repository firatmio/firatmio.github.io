import { createNoise3D } from "simplex-noise";
import { SIGNATURE_WEIGHT } from "../../fonts";
import { createRandom, gaussian } from "../../random";
import type { Box } from "../../signature/TrailField";
import { distanceToOutside } from "./raster";

const TEXT = "FTA";
/** Share of all particles that build the letters; the rest drift faintly behind them. */
const LETTER_SHARE = 0.38;
/** World height of the letters' relief at its crest. */
const RELIEF = 0.25;
/** Bevel width in raster px: how far in from the edge the surface curves up to its top. */
const BEVEL = 30;

type Vec3 = [number, number, number];

const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
/** Towards the light: from the upper left, in front of the letters. */
const LIGHT = normalize([-0.45, 0.55, 0.7]);

/**
 * The opening signature: the initials as one solid, sculpted body of luminous dust,
 * facing the camera. Each glyph's relief rises over a rounded bevel to a flat top, and a
 * raking light shades it — bevels facing the light glow, those turned away fall dark — so
 * the volume reads from light and shadow on a single surface, with no layers or tilt.
 *
 * @returns xyz per particle with its signature brightness in w, and the letters' world
 *   bounds on their plane.
 */
export function buildSignatureTargets(
  count: number,
  options: { cameraZ: number; fov: number; aspect: number; fontFamily: string; seed?: number },
): { positions: Float32Array; bounds: Box } {
  const { cameraZ, fov, aspect, fontFamily, seed = 404 } = options;
  const random = createRandom(seed);
  const noise = createNoise3D(random);

  const W = 1400;
  const H = 560;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `${SIGNATURE_WEIGHT} 400px ${fontFamily}`;
  ctx.letterSpacing = "10px";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(TEXT, W / 2, H / 2);
  const { data } = ctx.getImageData(0, 0, W, H);

  const dist = distanceToOutside(data, W, H);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dist[y * W + x]);
  // The relief: curving up over the bevel, flat across the top.
  const height = (x: number, y: number) => Math.sin((Math.min(at(x, y) / BEVEL, 1) * Math.PI) / 2);

  const inside: number[] = [];
  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (dist[y * W + x] === 0) continue;
      inside.push(x, y);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const glyphs = inside.length / 2;

  // Fit the word to the hero frame at z = 0, leaving air around it on narrow screens.
  const halfH = cameraZ * Math.tan((fov * Math.PI) / 360);
  const halfW = halfH * aspect;
  const scale = Math.min(6.4, halfW * 2 * 0.72) / Math.max(1, maxX - minX);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const positions = new Float32Array(count * 4);
  const bounds: Box = {
    minX: (minX - centerX) * scale,
    maxX: (maxX - centerX) * scale,
    minY: -(maxY - centerY) * scale,
    maxY: -(minY - centerY) * scale,
  };
  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    let brightness: number;

    if (glyphs > 0 && random() < LETTER_SHARE) {
      const k = Math.floor(random() * glyphs) * 2;
      const px = inside[k] + Math.floor(random() * 2);
      const py = inside[k + 1] + Math.floor(random() * 2);
      const h = height(px, py);

      // Surface normal from the relief's slope, converted from raster px to world units
      // (the raster's y runs down, the world's up).
      const slopeX = (RELIEF * (height(px + 2, py) - height(px - 2, py))) / (4 * scale);
      const slopeY = (-RELIEF * (height(px, py + 2) - height(px, py - 2))) / (4 * scale);
      const [nx, ny, nz] = normalize([-slopeX, -slopeY, 1]);
      const lambert = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const highlight = Math.pow(lambert, 12);

      x = (px + random() - centerX) * scale;
      y = -(py + random() - centerY) * scale;
      // A slow noise warp: strokes breathe instead of sitting on the raster grid.
      x += noise(x * 0.6, y * 0.6, 1.3) * 0.02;
      y += noise(x * 0.6, y * 0.6, 7.1) * 0.02;
      z = h * RELIEF + gaussian(random) * 0.005;
      brightness = (0.04 + 0.58 * lambert + 0.4 * highlight) * (0.95 + random() * 0.1);
    } else {
      // Faint dust behind the word, loosely clumped and spread through depth.
      z = -8 + random() * 11;
      const depthHalfH = (cameraZ - z) * Math.tan((fov * Math.PI) / 360);
      x = (random() * 2 - 1) * depthHalfH * aspect * 1.1;
      y = (random() * 2 - 1) * depthHalfH * 1.1;
      const clump = noise(x * 0.25, y * 0.25, z * 0.25) * 0.5 + 0.5;
      brightness = (0.03 + random() ** 3 * 0.12) * (0.4 + clump);
    }

    positions[i * 4] = x;
    positions[i * 4 + 1] = y;
    positions[i * 4 + 2] = z;
    positions[i * 4 + 3] = Math.min(brightness, 0.999);
  }
  return { positions, bounds };
}
