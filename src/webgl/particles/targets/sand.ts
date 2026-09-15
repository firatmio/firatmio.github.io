import { createNoise2D } from "simplex-noise";
import { QUACOMES_LOGO } from "@/content/quacomes-logo";
import { SAND } from "../../layout";
import { mix, type RGB } from "../../palette";
import { smoothstep } from "../../math";
import { createRandom } from "../../random";
import { rasterizeLogo } from "./logoRaster";

export interface SandTargets {
  positions: Float32Array;
  /** Lit grain colour (rgb, brightness baked in) and grain world size (w). */
  grains: Float32Array;
  /** Per-particle wait before settling, 0..1. */
  delays: Float32Array;
  /** The mark's corners in world space — its outline, for the link laid over it. */
  markCorners: [number, number, number][];
}

const LIGHT: RGB = [1.0, 0.72, 0.45];
const SHADE: RGB = [0.45, 0.28, 0.16];
const MINERAL: RGB = [0.22, 0.19, 0.17];
const QUARTZ: RGB = [1.0, 0.97, 0.9];

/** Share of the grains that build the Quacomes mark standing on the sand. */
const LOGO_SHARE = 0.18;
/** Of those, the share on its sides rather than its face. */
const SIDE_SHARE = 0.3;
/** How far in front of the camera the mark stands, and how wide it may be. */
const LOGO_DISTANCE = 2.8;
const LOGO_MAX_WIDTH = 2.8;
/**
 * The mark stands square to the camera, its thickness drawn obliquely — back, to the right
 * and a little up, like classic extruded lettering — so every letter's depth reads the same
 * way instead of splaying out from the middle of the frame in perspective. The depth is a
 * share of the mark's height, under the letters' stroke width.
 */
const LOGO_DEPTH = 0.1;
const EXTRUDE = { right: 0.8, up: 0.35, back: 0.5 };
/** The sides are a darker tone than the face, so they read as the block's flanks. */
const SIDE_TONE = 0.6;

type Vec3 = [number, number, number];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** A grain of the mark, in the mark's own frame: along the word, up, and back from its face. */
interface MarkGrain {
  u: number;
  h: number;
  back: number;
  normal: Vec3;
  tone: number;
  symbol: boolean;
}

/**
 * The sand state: every particle becomes a grain on a wind-rippled patch of ground laid
 * out under the sand camera's footprint — ripple crests wander with noise, with a gentle
 * windward face and a steep lee, picked out by low side light. On it stands the Quacomes
 * mark in its own colours as a solid block of grains: a bevelled face whose edges catch
 * or turn from the low sun, darker flanks, the sand shaded at its feet, and its
 * letters' shadow cast across the sand. Settled grains are opaque, so the mark covers the
 * sand behind it; grains it would hide entirely are laid elsewhere instead.
 */
export function buildSandTargets(
  count: number,
  options: { fov: number; aspect: number; seed?: number },
): SandTargets {
  const { fov, aspect, seed = 777 } = options;
  const random = createRandom(seed);
  const noise = createNoise2D(random);

  const [cx, cy, cz] = SAND.camera;
  const [tx, ty, tz] = SAND.target;
  const forwardLength = Math.hypot(tx - cx, tz - cz);
  const fx = (tx - cx) / forwardLength;
  const fz = (tz - cz) / forwardLength;
  const rx = -fz;
  const rz = fx;

  // ---------------------------------------------------------------- the mark's footprint
  const logo = rasterizeLogo();
  const faceCount = logo.faces.length / 5;
  const edgeCount = logo.edges.length / 4;
  const logoWidth = Math.min(LOGO_MAX_WIDTH, 2 * LOGO_DISTANCE * Math.tan((fov * Math.PI) / 360) * aspect * 0.82);
  const bx = cx + fx * LOGO_DISTANCE;
  const bz = cz + fz * LOGO_DISTANCE;
  // Along the word (left → right as the camera sees it), and the front face's normal.
  const along: Vec3 = [rx, 0, rz];
  const front: Vec3 = [-fx, 0, -fz];

  const dune = (x: number, z: number) => noise(x * 0.07, z * 0.07) * 0.12 + noise(x * 0.18 + 4, z * 0.18) * 0.07;
  // The ground passes through SAND.ground where the mark stands, so the camera's height
  // above it is fixed. Around the whole word it levels out, so no letter sinks where the
  // dunes rise.
  const duneAtMark = dune(bx, bz);
  const level = (x: number, z: number) => {
    const sideways = Math.abs((x - bx) * along[0] + (z - bz) * along[2]) - logoWidth / 2;
    const off = Math.abs((x - bx) * front[0] + (z - bz) * front[2]);
    return (1 - smoothstep(0, 0.9, sideways)) * (1 - smoothstep(0.3, 1.5, off));
  };
  const height = (x: number, z: number) => {
    const phase = (x * 0.35 + z * 0.94) * 17 + noise(x * 0.25, z * 0.25 + 9) * 3.2;
    const ripple = Math.sin(phase) + 0.35 * Math.sin(2 * phase + 0.8);
    const strength = 0.6 + 0.4 * (noise(x * 0.3 + 2, z * 0.3) * 0.5 + 0.5);
    const relief = (dune(x, z) - duneAtMark) * (1 - level(x, z));
    return SAND.ground + relief + ripple * 0.018 * strength;
  };

  // The ground footprint widens with distance, like the view frustum over it. It starts
  // at the bottom edge of the frame — nearer grains would never be seen.
  const spread = Math.tan((fov * Math.PI) / 360) * Math.max(aspect, 0.6) * 1.1;
  const eye = cy - height(cx, cz);
  const bottomDip = (fov * Math.PI) / 360 + Math.atan2(cy - ty, forwardLength);
  const NEAR = Math.max(0.3, eye / Math.tan(bottomDip) - 0.2);
  // The patch runs on a little way behind the mark, dimming as it goes, and dissolves into
  // the dark along a wandering edge.
  const FAR = LOGO_DISTANCE + 3;
  const halfWidth = (f: number) => 0.4 + f * spread;
  // Grains are laid evenly in distance rather than evenly over the ground, so they crowd
  // towards the camera — finer there, where they'd otherwise loom largest — and each is
  // sized to close ranks with its neighbours at its distance.
  const groundCount = count * (1 - LOGO_SHARE);
  const spacing = (f: number) => Math.sqrt((2 * halfWidth(f) * (FAR - NEAR)) / groundCount);
  const sun = [...SAND.sun] as Vec3;
  const e = 0.01;
  const lambertAt = (x: number, z: number) => {
    const hx = (height(x + e, z) - height(x - e, z)) / (2 * e);
    const hz = (height(x, z + e) - height(x, z - e)) / (2 * e);
    return Math.max(0, (-hx * sun[0] + sun[1] - hz * sun[2]) / Math.hypot(hx, 1, hz));
  };
  // Little ambient: the sun, not a flat fill, shapes the sand.
  const groundLight = (x: number, z: number) => 0.035 + 0.38 * lambertAt(x, z);

  // ---------------------------------------------------------------- the mark
  const logoHeight = logoWidth / logo.aspect;
  /** World units per raster px of the mark. */
  const pxWorld = logoWidth / logo.span;
  /** How far the bevel rises from the face's edge to its top. */
  const bevelDepth = logo.bevel * pxWorld;
  // Settled a touch into the sand where it stands.
  const by = height(bx, bz) - 0.015;
  const markGrainSize = Math.min(1.35 * spacing(LOGO_DISTANCE), logoHeight * 0.07);
  const markCorners = [
    [-0.5, 0],
    [0.5, 0],
    [0.5, 1],
    [-0.5, 1],
  ].map(([u, h]): [number, number, number] => [
    bx + along[0] * u * logoWidth,
    by + h * logoHeight,
    bz + along[2] * u * logoWidth,
  ]);

  /**
   * A grain of the face: the bevelled relief rises towards the camera over each edge, and
   * its slope turns the surface towards the sun or away from it.
   */
  const faceGrain = (): MarkGrain => {
    const k = Math.floor(random() * faceCount) * 5;
    const [uN, hN, rise, slopeU, slopeH] = logo.faces.subarray(k, k + 5);
    const tilt = normalize([-logo.bevel * slopeU, -logo.bevel * slopeH, 1]);
    return {
      u: (uN - 0.5) * logoWidth,
      h: hN * logoHeight,
      back: (1 - rise) * bevelDepth + random() * 0.002,
      normal: normalize([
        along[0] * tilt[0] + front[0] * tilt[2],
        tilt[1],
        along[2] * tilt[0] + front[2] * tilt[2],
      ]),
      tone: 1,
      symbol: uN < logo.symbolEnd,
    };
  };
  /**
   * A grain of the sides: an edge swept back along the oblique depth. Only walls the
   * extrusion turns towards the camera are sampled — the rest lie behind the face.
   */
  const sideGrain = (): MarkGrain | null => {
    for (let tries = 0; tries < 10; tries++) {
      const k = Math.floor(random() * edgeCount) * 4;
      const [uN, hN, nu, nh] = logo.edges.subarray(k, k + 4);
      if (nu * EXTRUDE.right + nh * EXTRUDE.up <= 0.05) continue;
      const depth = random() * LOGO_DEPTH * logoHeight;
      return {
        u: (uN - 0.5) * logoWidth + depth * EXTRUDE.right,
        h: hN * logoHeight + depth * EXTRUDE.up,
        back: bevelDepth + depth * EXTRUDE.back,
        normal: [along[0] * nu, nh, along[2] * nu],
        tone: SIDE_TONE,
        symbol: uN < logo.symbolEnd,
      };
    }
    return null;
  };

  /** Does a letter cover this point of the front plane (u along the word, h up)? */
  const covered = (u: number, h: number) =>
    h >= 0 && h <= logoHeight && Math.abs(u) <= logoWidth / 2 && logo.covers(u / logoWidth + 0.5, h / logoHeight);
  /** Following a line from p along d, does it pass through a letter within `reach`? */
  const crossesLetter = (p: Vec3, d: Vec3, reach: number) => {
    const facing = d[0] * front[0] + d[2] * front[2];
    if (Math.abs(facing) < 1e-6) return false;
    const t = ((bx - p[0]) * front[0] + (bz - p[2]) * front[2]) / facing;
    if (t <= 0 || t >= reach) return false;
    const qx = p[0] + d[0] * t;
    const qy = p[1] + d[1] * t;
    const qz = p[2] + d[2] * t;
    return covered((qx - bx) * along[0] + (qz - bz) * along[2], qy - by);
  };
  /**
   * How deep in the letters' shade a spot on the sand lies, 0..1: darkest right against
   * their feet, fading within a fraction of their height.
   */
  const footShade = (sideways: number, offPlane: number) => {
    const reach = 0.18 * logoHeight;
    if (Math.abs(offPlane) > 4 * reach) return 0;
    let shelter = 0;
    for (const s of [-1, -0.5, 0, 0.5, 1]) {
      if (covered(sideways + s * reach, 0.03 * logoHeight)) shelter = Math.max(shelter, 1 - Math.abs(s) * 0.6);
    }
    return shelter * Math.exp(-Math.abs(offPlane) / reach);
  };
  const camera: Vec3 = [cx, cy, cz];
  const hiddenByLogo = (p: Vec3) => crossesLetter(camera, [p[0] - cx, p[1] - cy, p[2] - cz], 1);
  const inLogoShadow = (p: Vec3) => crossesLetter(p, sun, Infinity);

  const positions = new Float32Array(count * 3);
  const grains = new Float32Array(count * 4);
  const delays = new Float32Array(count);
  const write = (i: number, p: Vec3, color: RGB, light: number, size: number) => {
    positions.set(p, i * 3);
    grains.set([color[0] * light, color[1] * light, color[2] * light, size], i * 4);
    delays[i] = random();
  };

  for (let i = 0; i < count; i++) {
    if (faceCount > 0 && random() < LOGO_SHARE) {
      const grain = (edgeCount > 0 && random() < SIDE_SHARE ? sideGrain() : null) ?? faceGrain();
      const lambert = Math.max(0, dot(grain.normal, sun));
      write(
        i,
        [
          bx + along[0] * grain.u - front[0] * grain.back,
          by + grain.h,
          bz + along[2] * grain.u - front[2] * grain.back,
        ],
        [...(grain.symbol ? QUACOMES_LOGO.symbol : QUACOMES_LOGO.lettering)],
        grain.tone * (0.18 + 0.8 * lambert + 0.2 * Math.pow(lambert, 10)),
        // Fine enough for the strokes, however small the mark stands on a narrow screen.
        markGrainSize * (0.32 + random() * 0.2),
      );
      continue;
    }

    // A grain of the ground. Where the mark would hide it from the camera, lay it elsewhere.
    let p: Vec3 = [0, 0, 0];
    let f = NEAR;
    for (let tries = 0; tries < 8; tries++) {
      f = NEAR + random() * (FAR - NEAR);
      const l = (random() * 2 - 1) * halfWidth(f);
      const x = cx + fx * f + rx * l;
      const z = cz + fz * f + rz * l;
      p = [x, height(x, z), z];
      if (!hiddenByLogo(p)) break;
    }

    const offPlane = (p[0] - bx) * front[0] + (p[2] - bz) * front[2];
    const sideways = (p[0] - bx) * along[0] + (p[2] - bz) * along[2];
    const size = 1.15 * spacing(f) * (0.7 + random() * 0.6);
    p[1] += random() * size * 0.4;

    // Full light where the letters' shadows fall just behind them, dimming further back.
    const ahead = (p[0] - cx) * fx + (p[2] - cz) * fz;
    const edge = FAR - 0.3 - 1.3 * (noise(p[0] * 0.45 + 7, p[2] * 0.45) * 0.5 + 0.5);
    const recede =
      (1 - 0.4 * smoothstep(LOGO_DISTANCE + 0.6, FAR, ahead)) * (1 - smoothstep(edge - 0.8, edge + 0.3, ahead));
    let light = groundLight(p[0], p[2]) * recede;
    // The letters' shadow, cast by the low sun across the sand.
    if (inLogoShadow(p)) light *= 0.22;
    // Contact: the sand right at the letters' feet lies in their shade.
    light *= 1 - 0.8 * footShade(sideways, offPlane);

    const roll = random();
    const base = roll < 0.06 ? MINERAL : roll < 0.09 ? QUARTZ : mix(SHADE, LIGHT, 0.35 + random() * 0.65);
    write(i, p, base, light, size);
  }

  return { positions, grains, delays, markCorners };
}
