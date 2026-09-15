import { QUACOMES_LOGO } from "@/content/quacomes-logo";
import { distanceToOutside } from "./raster";

/** Raster px per SVG unit. */
const S = 0.5;
/** Bevel width in raster px: how far in from the edge the face curves up to its top. */
const BEVEL = 5;

/** The Quacomes wordmark as a bevelled relief, in its content box: u 0..1 left→right, h 0..1 up. */
export interface LogoRaster {
  /** Width over height of the mark's content box. */
  aspect: number;
  /** Where the Q symbol ends and the lettering begins, in u. */
  symbolEnd: number;
  /** The content box's width in raster px — converts raster px to world units. */
  span: number;
  /** The bevel's depth in raster px: it rises as far as it runs in. */
  bevel: number;
  /**
   * Per covered pixel: u, h, the relief's height (0 at the edge, 1 across the top) and its
   * slope along u and along h, per raster px.
   */
  faces: Float32Array;
  /** u, h, outward normal (nu, nh) per edge pixel. */
  edges: Float32Array;
  covers(u: number, h: number): boolean;
}

/** Rasterise the wordmark once — `Path2D` reads the SVG path data as is. */
export function rasterizeLogo(): LogoRaster {
  const W = Math.ceil(QUACOMES_LOGO.width * S);
  const H = Math.ceil(QUACOMES_LOGO.height * S);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(S, S);
  ctx.fillStyle = "#fff";
  for (const d of QUACOMES_LOGO.paths) ctx.fill(new Path2D(d));
  const { data } = ctx.getImageData(0, 0, W, H);
  const alpha = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? 0 : data[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];

  // The relief: curving up over the bevel, flat across the top.
  const dist = distanceToOutside(data, W, H);
  const relief = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? 0 : Math.sin((Math.min(dist[y * W + x] / BEVEL, 1) * Math.PI) / 2);

  let minX = W;
  let maxX = 0;
  let minY = H;
  let maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha(x, y) < 128) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const toU = (x: number) => (x - minX) / spanX;
  const toH = (y: number) => (maxY - y) / spanY;

  const faces: number[] = [];
  const edges: number[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (alpha(x, y) < 128) continue;
      // The raster's y runs down, the mark's h up.
      const slopeU = (relief(x + 1, y) - relief(x - 1, y)) / 2;
      const slopeH = (relief(x, y - 1) - relief(x, y + 1)) / 2;
      faces.push(toU(x), toH(y), relief(x, y), slopeU, slopeH);
      const edge =
        alpha(x - 2, y) < 128 || alpha(x + 2, y) < 128 || alpha(x, y - 2) < 128 || alpha(x, y + 2) < 128;
      if (!edge) continue;
      // Alpha rises inward, so the outward normal runs against its gradient.
      const gx = alpha(x + 2, y) - alpha(x - 2, y);
      const gy = alpha(x, y + 2) - alpha(x, y - 2);
      const gl = Math.hypot(gx, gy) || 1;
      edges.push(toU(x), toH(y), -gx / gl, gy / gl);
    }
  }

  return {
    aspect: spanX / spanY,
    symbolEnd: toU(QUACOMES_LOGO.symbolEnd * S),
    span: spanX,
    bevel: BEVEL,
    faces: new Float32Array(faces),
    edges: new Float32Array(edges),
    covers: (u, h) => alpha(minX + u * spanX, maxY - h * spanY) >= 128,
  };
}
