import { CatmullRomCurve3, type Vector3 } from "three";

export interface CameraStop {
  /** Scroll progress at which the camera rests here. */
  at: number;
  position: Vector3;
  target: Vector3;
}

/** Fraction of each leg spent settling at either end, so the camera lingers at stops. */
const DWELL = 0.12;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * A single camera flight through every stop. Position and look-at target each ride a
 * centripetal Catmull-Rom spline; progress within each leg is eased so the camera eases
 * out of one stop, cruises, and eases into the next — never a linear glide.
 */
export class CameraPath {
  private readonly positions: CatmullRomCurve3;
  private readonly targets: CatmullRomCurve3;

  constructor(private readonly stops: CameraStop[]) {
    this.positions = new CatmullRomCurve3(stops.map((s) => s.position), false, "centripetal");
    this.targets = new CatmullRomCurve3(stops.map((s) => s.target), false, "centripetal");
  }

  evaluate(progress: number, position: Vector3, target: Vector3): void {
    const stops = this.stops;
    const last = stops.length - 1;
    const p = Math.min(Math.max(progress, stops[0].at), stops[last].at);

    let leg = 0;
    while (leg < last - 1 && p > stops[leg + 1].at) leg++;
    const span = stops[leg + 1].at - stops[leg].at;
    const local = span > 0 ? (p - stops[leg].at) / span : 0;
    const settled = clamp01((local - DWELL) / (1 - 2 * DWELL));

    // getPoint (not getPointAt) is index-parameterised: u = leg / last lands exactly on a stop.
    const u = (leg + easeInOutSine(settled)) / last;
    this.positions.getPoint(u, position);
    this.targets.getPoint(u, target);
  }
}
