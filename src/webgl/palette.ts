export type RGB = [number, number, number];

// Linear-space palette. Cool tissue with warm project hubs.
export const AZURE: RGB = [0.3, 0.58, 1.0];
export const VIOLET: RGB = [0.58, 0.42, 1.0];
export const TEAL: RGB = [0.22, 0.85, 0.82];
export const EMBER: RGB = [1.0, 0.62, 0.32];
export const PALE: RGB = [0.82, 0.9, 1.0];

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
