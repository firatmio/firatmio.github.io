import {
  ClampToEdgeWrapping,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  RGBAFormat,
  Vector4,
} from "three";

/** World units per cell. */
const CELL = 0.05;
/** World radius the cursor disturbs as it passes. */
const BRUSH = 0.16;
/** Seconds for a disturbance to fade to ~37% — the grains drift back unhurried. */
const RECOVERY = 1.6;

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * The memory of where the cursor has swept across the signature. Each frame the stroke
 * since the last frame is painted into a small grid over the letters — intensity plus the
 * direction of the swipe — and everything fades slowly. The grid goes to the GPU as a
 * texture; grains read it to scatter along the stroke and drift back as it fades.
 */
export class TrailField {
  readonly texture: DataTexture;
  /** World rect the grid covers: min x, min y, width, height. */
  readonly bounds: Vector4;

  private readonly cols: number;
  private readonly rows: number;
  /** rgba per cell: intensity, swipe x, swipe y, unused. */
  private readonly field: Float32Array;
  private readonly upload: Uint16Array;
  private last: { x: number; y: number } | null = null;
  private live = false;

  constructor(box: Box) {
    const margin = 0.4;
    this.cols = Math.ceil((box.maxX - box.minX + margin * 2) / CELL);
    this.rows = Math.ceil((box.maxY - box.minY + margin * 2) / CELL);
    this.bounds = new Vector4(box.minX - margin, box.minY - margin, this.cols * CELL, this.rows * CELL);

    this.field = new Float32Array(this.cols * this.rows * 4);
    this.upload = new Uint16Array(this.cols * this.rows * 4);
    // Half float: linear filtering of it is core in WebGL2, unlike full float.
    this.texture = new DataTexture(this.upload, this.cols, this.rows, RGBAFormat, HalfFloatType);
    this.texture.minFilter = LinearFilter;
    this.texture.magFilter = LinearFilter;
    this.texture.wrapS = ClampToEdgeWrapping;
    this.texture.wrapT = ClampToEdgeWrapping;
    this.texture.needsUpdate = true;
  }

  /** @param point the cursor on the letters' plane, or `null` when it isn't stirring. */
  update(delta: number, point: { x: number; y: number } | null): void {
    // Settled and untouched: nothing to fade, nothing to upload.
    if (!point && !this.live) {
      this.last = null;
      return;
    }
    const fade = Math.exp(-delta / RECOVERY);
    let energy = 0;
    for (let i = 0; i < this.field.length; i += 4) {
      this.field[i] *= fade;
      this.field[i + 1] *= fade;
      this.field[i + 2] *= fade;
      energy = Math.max(energy, this.field[i]);
    }

    if (point) this.stroke(point);
    else this.last = null;

    // Upload only while something is moving, plus once more to settle at rest.
    const wasLive = this.live;
    this.live = energy > 1e-3 || point !== null;
    if (!this.live && !wasLive) return;
    for (let i = 0; i < this.field.length; i++) this.upload[i] = DataUtils.toHalfFloat(this.field[i]);
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
  }

  private stroke(to: { x: number; y: number }): void {
    const from = this.last ?? to;
    this.last = { x: to.x, y: to.y };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    // Only movement leaves a trail — a resting cursor doesn't bore a hole.
    if (length < 1e-4) return;
    const steps = Math.ceil(length / (CELL * 0.5));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      this.stamp(from.x + dx * t, from.y + dy * t, dx / length, dy / length);
    }
  }

  private stamp(x: number, y: number, dirX: number, dirY: number): void {
    const cx = (x - this.bounds.x) / CELL;
    const cy = (y - this.bounds.y) / CELL;
    const r = BRUSH / CELL;
    for (let j = Math.floor(cy - r); j <= Math.ceil(cy + r); j++) {
      if (j < 0 || j >= this.rows) continue;
      for (let i = Math.floor(cx - r); i <= Math.ceil(cx + r); i++) {
        if (i < 0 || i >= this.cols) continue;
        const d2 = ((i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2) / (r * r);
        if (d2 > 1) continue;
        const w = Math.exp(-d2 * 3) * 0.35;
        const k = (j * this.cols + i) * 4;
        this.field[k] = Math.min(1, this.field[k] + w);
        this.field[k + 1] += dirX * w;
        this.field[k + 2] += dirY * w;
      }
    }
  }
}
