import { createNoise2D } from "simplex-noise";
import { contacts } from "@/content/contact";
import { DESERT } from "../../layout";
import { clamp01, smoothstep } from "../../math";
import { EMBER, PALE, mix, type RGB } from "../../palette";
import { createRandom, gaussian } from "../../random";
import { ROLE, type ParticleBuffers } from "../buffers";
import { rasterizeIcon } from "./iconRaster";
import type { Soma } from "./neuron";

export const DESERT_KIND = { ground: 0, sky: 1, drift: 2 } as const;

/** How many colours the contact logos may use between them (the shaders' palette size). */
export const LOGO_PALETTE_SIZE = 4;

type Vec3 = [number, number, number];

/**
 * How the finale's contact logos are laid out: the shaders place each logo star from its
 * packed (u, v) on this plane.
 */
export interface LogoLayout {
  /** The plane facing the finale camera: origin + axisU · u + axisV · v, u and v in 0..1. */
  origin: Vec3;
  axisU: Vec3;
  axisV: Vec3;
  /** Each logo's middle on the plane (u, v), in contacts order — a loose 2×2. */
  cells: [number, number][];
  /** Linear colours the logos are drawn in, brightness baked in. */
  palette: RGB[];
  /** World size of a star in a logo. */
  grain: number;
  /** Each logo's box corners in world space, in contacts order — for the links laid over them. */
  corners: Vec3[][];
}

export interface DesertTargets {
  /** xyz per particle; w packs its place in the contact logos: floor(u · 4095) + v. */
  positions: Float32Array;
  /** Lit colour (rgb, brightness baked in) and world size (w). */
  looks: Float32Array;
  /** Kind (integer part, see DESERT_KIND) plus the wait before moving (fractional part). */
  kinds: Float32Array;
  /**
   * Per particle: 0 outside the contact logos, else its colour — an index into
   * LogoLayout.palette, counting from 1 — plus 0.5 for each logo's seed star.
   */
  logoTones: Float32Array;
  logos: LogoLayout;
}

const DUNE_LIT: RGB = [0.5, 0.42, 0.36];
/** Faces turned from the moon still catch skylight — dim, cool, but never empty. */
const DUNE_SHADE: RGB = [0.16, 0.15, 0.19];
const STAR_COOL: RGB = [0.7, 0.8, 1.0];
const STAR_WARM: RGB = [1.0, 0.82, 0.6];
const DEG = Math.PI / 180;

/** How far in front of the finale camera the contact logos stand. */
const LOGO_DISTANCE = 100;
/** A logo star's brightness, on top of its brand colour. */
const LOGO_BRIGHT = 0.6;
/** Chance a sky star joins the logos — lower in the Milky Way, so the band stays. */
const RECRUIT = { band: 0.4, field: 0.8 };

const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const offset = (p: Vec3, d: Vec3, s: number): Vec3 => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
const hexToLinear = (hex: string): RGB =>
  [16, 8, 0].map((shift) => {
    const c = ((parseInt(hex.slice(1), 16) >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as RGB;

/**
 * The closing state: most sand grains spread out into moonlit dunes running to the
 * horizon, the rest rise into the sky as stars — a lumpy Milky Way with a dark rift, and
 * the first project hubs as the bright contact stars. At the finale many of the stars
 * gather into the contact logos, each through its contact star, in the platform's colours.
 */
export function buildDesertTargets(
  particles: ParticleBuffers,
  somas: Soma[],
  options: { fov: number; aspect: number; seed?: number },
): DesertTargets {
  const { fov, aspect, seed = 1001 } = options;
  const random = createRandom(seed);
  const noise = createNoise2D(random);
  const { count, roles, groups } = particles;

  const [cx, cy, cz] = DESERT.camera;
  const [tx, , tz] = DESERT.target;
  const heading = Math.hypot(tx - cx, tz - cz);
  const fx = (tx - cx) / heading;
  const fz = (tz - cz) / heading;
  const rx = -fz;
  const rz = fx;

  /** Unit direction for an azimuth (from the view heading) and an elevation, in radians. */
  const skyDir = (azimuth: number, elevation: number): Vec3 => {
    const ce = Math.cos(elevation);
    return [
      (fx * Math.cos(azimuth) + rx * Math.sin(azimuth)) * ce,
      Math.sin(elevation),
      (fz * Math.cos(azimuth) + rz * Math.sin(azimuth)) * ce,
    ];
  };
  const onSky = (d: Vec3, radius: number): Vec3 => [cx + d[0] * radius, cy + d[1] * radius, cz + d[2] * radius];

  // Transverse dunes: crests run across the wind, sharp on top, their lines bent by noise.
  const dune = (x: number, z: number) => {
    const warp = noise(x * 0.02, z * 0.02) * 6;
    const u = (z * 0.9 + x * 0.3 + warp) / 14;
    const crest = Math.pow(1 - Math.abs(Math.sin(Math.PI * u + noise(x * 0.03 + 5, z * 0.03) * 0.8)), 1.6);
    const swell = noise(x * 0.008 + 3, z * 0.008) * 0.5 + 0.5;
    return { height: (crest * 2.2 + noise(x * 0.05, z * 0.05) * 0.4) * (0.5 + swell), crest };
  };
  // Open, flat sand where the camera stands; the dunes rise beyond it.
  const groundAt = (x: number, z: number) => {
    const d = dune(x, z);
    const open = smoothstep(6, 18, Math.hypot(x - cx, z - cz));
    // Wind ripples across every face — the texture the sand had up close, now far off.
    const ripple = Math.sin((x * 0.3 + z * 0.95) * 7.5 + noise(x * 0.15, z * 0.15 + 4) * 3) * 0.035;
    return { y: DESERT.ground + d.height * open + ripple, crest: d.crest * open };
  };

  const spread = Math.tan((fov * Math.PI) / 360) * Math.max(aspect, 0.6) * 1.1;
  // Ground is laid out by the angle below the horizon, so the grains spread evenly over the
  // screen — the foreground as full as the far dunes. It stops just past the bottom edge of
  // the frame at the desert stop: the camera looks up out here, and any grain nearer than
  // that would never be seen.
  const EYE = cy - DESERT.ground;
  const FAR = 260;
  const pitch = Math.atan2(DESERT.target[1] - cy, heading);
  const MAX_DIP = (fov * Math.PI) / 360 - pitch + 0.03;
  const NEAR = EYE / Math.tan(MAX_DIP);
  const MIN_DIP = Math.atan(EYE / FAR);
  const [mx, my, mz] = DESERT.moon;

  // The Milky Way: a lumpy band rising from the horizon on the left and crossing the frame
  // towards the upper right — kept inside the view, which only reaches ~38° up.
  const bandFrom = skyDir(-50 * DEG, 3 * DEG);
  const bandTo = skyDir(45 * DEG, 40 * DEG);
  const omega = Math.acos(dot(bandFrom, bandTo));
  const bandNormal = normalize(cross(bandFrom, bandTo));
  const bandPoint = (): { dir: Vec3; core: number } | null => {
    const t = -0.15 + random() * 1.3;
    const a = Math.sin((1 - t) * omega) / Math.sin(omega);
    const b = Math.sin(t * omega) / Math.sin(omega);
    const width = 0.12 * (0.6 + 0.8 * (noise(t * 4, 1.7) * 0.5 + 0.5));
    const offsetFromAxis = gaussian(random) * width;
    // Dust lanes: long and meandering, running with the band. They dim it rather than empty
    // it — some stars always show through, and the lane frays and breaks up along its run.
    const lane = noise(t * 4, 8.3) * width * 0.35;
    const inLane = 1 - Math.min(1, Math.abs(offsetFromAxis - lane) / (width * 0.2));
    const dust = inLane * (noise(t * 2.5, 4.2) * 0.5 + 0.5);
    if (random() < dust * 0.75) return null;
    const d = normalize([
      bandFrom[0] * a + bandTo[0] * b + bandNormal[0] * offsetFromAxis,
      bandFrom[1] * a + bandTo[1] * b + bandNormal[1] * offsetFromAxis,
      bandFrom[2] * a + bandTo[2] * b + bandNormal[2] * offsetFromAxis,
    ]);
    if (d[1] < 0.02) return null;
    return { dir: d, core: Math.exp(-(((t - 0.4) / 0.25) ** 2)) };
  };
  const fieldDir = (): Vec3 => {
    const sinE = Math.sin(DEG) + random() * (Math.sin(75 * DEG) - Math.sin(DEG));
    return skyDir((random() * 2 - 1) * 80 * DEG, Math.asin(sinE));
  };

  const contactStars = DESERT.contacts.map(([az, el]) => onSky(skyDir(az * DEG, el * DEG), DESERT.skyRadius * 0.9));
  // The most prominent project hubs become the contact stars.
  const hubRank = new Map<number, number>();
  somas.forEach((s, i) => {
    if (s.hub) hubRank.set(i, hubRank.size);
  });

  // ---------------------------------------------------------------- contact logos
  // At the finale the stars gather into the contact logos: a loose 2×2 on a plane facing
  // the finale camera, a little above the middle of the frame — clear of the horizon — and
  // sized to fit a phone's width as well.
  const [lx, ly, lz] = DESERT.finaleCamera;
  const [ltx, lty, ltz] = DESERT.finaleTarget;
  const view = normalize([ltx - lx, lty - ly, ltz - lz]);
  const right = normalize(cross(view, [0, 1, 0]));
  const up = cross(right, view);
  const halfH = LOGO_DISTANCE * Math.tan((fov * Math.PI) / 360);
  const logoSize = Math.min(halfH * 0.36, halfH * aspect * 0.62);
  const gap = logoSize * 0.55;
  const margin = logoSize * 0.12;
  const span = 2 * logoSize + gap + 2 * margin;
  const centre = offset(offset([lx, ly, lz], view, LOGO_DISTANCE), up, halfH * 0.2);
  const origin = offset(offset(centre, right, -span / 2), up, -span / 2);
  const axisU = scale(right, span) as Vec3;
  const axisV = scale(up, span) as Vec3;
  const onPlane = (u: number, v: number): Vec3 => offset(offset(origin, axisU, u), axisV, v);

  // Every colour the marks use, once: the shaders look them up by index.
  const palette: RGB[] = [];
  const paletteIndex = (hex: string) => {
    const rgb = scale(hexToLinear(hex), LOGO_BRIGHT);
    const found = palette.findIndex((c) => c.every((v, j) => v === rgb[j]));
    return found >= 0 ? found : palette.push(rgb) - 1;
  };
  const marks = contacts.map((contact, k) => {
    const raster = rasterizeIcon(contact.mark);
    // Not a rigid grid: each logo sits a little off its slot, at its own size.
    const extent = logoSize * (0.94 + random() * 0.12);
    const col = k % 2;
    const top = k < 2;
    const cu = (margin + logoSize / 2 + col * (logoSize + gap) + (random() - 0.5) * 0.08 * logoSize) / span;
    const cv = (margin + logoSize / 2 + (top ? logoSize + gap : 0) + (random() - 0.5) * 0.08 * logoSize) / span;
    // Where the contact star settles: the covered point nearest the logo's middle.
    let seedPoint = 0;
    let nearest = Infinity;
    for (let j = 0; j < raster.layers.length; j++) {
      const d = (raster.points[j * 2] - 0.5) ** 2 + (raster.points[j * 2 + 1] - 0.5) ** 2;
      if (d < nearest) {
        nearest = d;
        seedPoint = j;
      }
    }
    return {
      raster,
      cu,
      cv,
      extent: extent / span,
      tones: contact.mark.layers.map((layer) => paletteIndex(layer.color) + 1),
      seedPoint,
      area: raster.coverage * extent * extent,
    };
  });
  if (palette.length > LOGO_PALETTE_SIZE) throw new Error(`Contact logos use more than ${LOGO_PALETTE_SIZE} colours`);
  // Stars are shared out by each logo's area, so every logo is drawn equally densely.
  const totalArea = marks.reduce((sum, m) => sum + m.area, 0);
  const pickMark = () => {
    let r = random() * totalArea;
    for (let k = 0; k < marks.length - 1; k++) {
      r -= marks[k].area;
      if (r <= 0) return k;
    }
    return marks.length - 1;
  };
  let logoStars = 0;
  /** A star's place in logo k — at point j of its mark, or any — packed for the shaders. */
  const logoPlace = (k: number, j = Math.floor(random() * marks[k].raster.layers.length)) => {
    const m = marks[k];
    const u = clamp01(m.cu + (m.raster.points[j * 2] - 0.5) * m.extent);
    const v = clamp01(m.cv + (m.raster.points[j * 2 + 1] - 0.5) * m.extent);
    logoStars++;
    return { packed: Math.floor(u * 4095) + Math.min(v, 0.999), tone: m.tones[m.raster.layers[j]] };
  };

  const positions = new Float32Array(count * 4);
  const looks = new Float32Array(count * 4);
  const kinds = new Float32Array(count);
  const logoTones = new Float32Array(count);
  const write = (
    i: number,
    p: Vec3,
    color: RGB,
    size: number,
    kind: number,
    delay: number,
    logo?: { packed: number; tone: number },
  ) => {
    positions.set(p, i * 4);
    positions[i * 4 + 3] = logo?.packed ?? 0;
    looks.set([color[0], color[1], color[2], size], i * 4);
    kinds[i] = kind + Math.min(delay, 0.999);
    logoTones[i] = logo?.tone ?? 0;
  };

  for (let i = 0; i < count; i++) {
    const role = roles[i];
    const rank = role === ROLE.nucleus ? hubRank.get(groups[i]) : undefined;

    if (rank !== undefined && rank < contactStars.length) {
      // A contact star: the seed its logo gathers around.
      const place = logoPlace(rank, marks[rank].seedPoint);
      write(i, contactStars[rank], scale(mix(EMBER, PALE, 0.45), 3.2), 3, DESERT_KIND.sky, 0.6, {
        packed: place.packed,
        tone: place.tone + 0.5,
      });
      continue;
    }

    if (role === ROLE.nucleus || random() < 0.15) {
      let dir: Vec3 | null = null;
      let core = 0;
      if (random() < 0.7) {
        for (let k = 0; k < 8 && !dir; k++) {
          const b = bandPoint();
          if (b) {
            dir = b.dir;
            core = b.core;
          }
        }
      }
      const inBand = dir !== null;
      dir ??= fieldDir();
      const brightness =
        role === ROLE.nucleus
          ? 1.2 + random() * 1.5
          : inBand
            ? (0.3 + random() ** 3 * 1.2) * (0.7 + core)
            : 0.12 + random() ** 6 * 2.2;
      const tone = mix(STAR_COOL, STAR_WARM, inBand ? core * 0.8 : random() ** 2);
      // Band stars stay near pixel size so the band reads as a luminous haze of them.
      const size = inBand ? 0.7 + random() * 0.5 : 0.6 + random() ** 4 * 1.6;
      const radius = DESERT.skyRadius * (0.9 + random() * 0.2);
      const recruited = random() < (inBand ? RECRUIT.band : RECRUIT.field);
      write(
        i,
        onSky(dir, radius),
        scale(tone, brightness),
        size,
        DESERT_KIND.sky,
        0.3 + random() * 0.7,
        recruited ? logoPlace(pickMark()) : undefined,
      );
      continue;
    }

    // Ground: equal steps in the angle below the horizon (see above).
    const f = EYE / Math.tan(MIN_DIP + random() * (MAX_DIP - MIN_DIP));
    const far01 = Math.log(f / NEAR) / Math.log(FAR / NEAR);
    const l = (random() * 2 - 1) * (1 + f * spread);
    const x = cx + fx * f + rx * l;
    const z = cz + fz * f + rz * l;
    const ground = groundAt(x, z);
    const e = 0.25;
    const hx = (groundAt(x + e, z).y - groundAt(x - e, z).y) / (2 * e);
    const hz = (groundAt(x, z + e).y - groundAt(x, z - e).y) / (2 * e);
    const lambert = Math.max(0, (-hx * mx + my - hz * mz) / Math.hypot(hx, 1, hz));
    // Dimmer per grain than it looks: neighbours overlap into a continuous surface. (Their
    // light adds up with the area they cover, so finer grains each carry more of it.)
    const light = 0.45 * (1 - 0.5 * far01) * (0.8 + random() * 0.4);
    const drift = f < 45 && ground.crest > 0.7 && random() < 0.3;
    write(
      i,
      [x, ground.y + (drift ? 0.05 : 0), z],
      scale(mix(DUNE_SHADE, DUNE_LIT, lambert ** 1.2), light),
      // Grows with distance so every grain covers about the same ~6px on screen — fine, yet
      // enough that neighbours overlap and the dunes read as surfaces, not speckle.
      Math.max(0.025, f * 0.006) * (0.75 + random() * 0.5),
      drift ? DESERT_KIND.drift : DESERT_KIND.ground,
      far01 * 0.7 + random() * 0.3,
    );
  }

  const box: [number, number][] = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ];
  const logos: LogoLayout = {
    origin,
    axisU,
    axisV,
    cells: marks.map((m) => [m.cu, m.cv]),
    palette,
    // Each logo star is sized to close ranks with its neighbours.
    grain: 1.3 * Math.sqrt(totalArea / Math.max(1, logoStars)),
    corners: marks.map((m) => box.map(([a, b]) => onPlane(m.cu + a * m.extent, m.cv + b * m.extent))),
  };

  return { positions, looks, kinds, logoTones, logos };
}
