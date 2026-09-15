import type { ContactMark } from "@/content/contact";

const SIZE = 256;

/** A contact mark as a coverage mask over its square box. */
export interface IconRaster {
  /** u, v per covered pixel: 0..1 across the box, v up. */
  points: Float32Array;
  /** Which of the mark's layers each point ended up painted by. */
  layers: Uint8Array;
  /** Share of the box the mark covers. */
  coverage: number;
}

/** Rasterise a mark once — `Path2D` reads the SVG path data as is. */
export function rasterizeIcon(mark: ContactMark): IconRaster {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(SIZE / mark.viewBox, SIZE / mark.viewBox);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Each layer paints its own shade of red, so the raster tells which layer every pixel
  // ended up under.
  const STEP = 40;
  mark.layers.forEach((layer, i) => {
    const paint = `rgb(${(i + 1) * STEP}, 0, 0)`;
    const path = new Path2D(layer.d);
    if (layer.stroke) {
      ctx.strokeStyle = paint;
      ctx.lineWidth = layer.stroke;
      ctx.stroke(path);
    } else {
      ctx.fillStyle = paint;
      ctx.fill(path);
    }
  });
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  const points: number[] = [];
  const layers: number[] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      if (data[i + 3] < 128) continue;
      points.push((x + 0.5) / SIZE, 1 - (y + 0.5) / SIZE);
      layers.push(Math.min(mark.layers.length - 1, Math.max(0, Math.round(data[i] / STEP) - 1)));
    }
  }
  return {
    points: new Float32Array(points),
    layers: Uint8Array.from(layers),
    coverage: layers.length / (SIZE * SIZE),
  };
}
