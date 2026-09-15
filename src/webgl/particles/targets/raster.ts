/**
 * Distance from every covered pixel of an RGBA raster (alpha ≥ 128) to the outside, in px,
 * by a two-pass chamfer transform; 0 outside. Lettering gets its bevelled relief from it.
 */
export function distanceToOutside(data: Uint8ClampedArray, W: number, H: number): Float32Array {
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = data[i * 4 + 3] >= 128 ? 1e9 : 0;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dist[y * W + x]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (dist[i] === 0) continue;
      dist[i] = Math.min(dist[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (dist[i] === 0) continue;
      dist[i] = Math.min(dist[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
  }
  return dist;
}
