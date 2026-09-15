type Vec3 = readonly [number, number, number];

const normalize = ([x, y, z]: Vec3): Vec3 => {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
};

/**
 * The camera's lens and the opening framing — shared by the journey and the standalone
 * signature (the 404 page).
 */
export const VIEW = {
  fov: 50,
  cameraZ: 10,
  /** The signature is framed a touch further back; the camera eases in as the network grows. */
  signatureZ: 10.6,
};

/**
 * Where the star field forms, in world space. Shared by the galaxy targets, the camera
 * path and the shaders' disc rotation.
 */
export const GALAXY = {
  center: [0, -0.5, -4] as Vec3,
  /** Disc normal — tilted so the camera sees the arms at a raking angle, not face-on. */
  axis: normalize([0.13, 0.95, 0.45]),
  radius: 11,
};

/**
 * Where the star field collapses into sand: a ground plane below the galaxy and the
 * low, raking camera the grains are laid out for.
 */
export const SAND = {
  ground: -3,
  // A little above the grains, looking down on the Quacomes mark standing on them: its
  // feet meet the sand in plain view and the sand runs on behind it.
  camera: [0.6, -2.1, 1.5] as Vec3,
  target: [0.3, -3.0, -2.0] as Vec3,
  /**
   * Towards the sun: low and from the left, so ripple crests catch light on one face and
   * the mark standing on the sand throws its shadow sideways across it.
   */
  sun: normalize([-0.85, 0.35, 0.3]),
};

/**
 * The night desert the journey ends in: dunes running to the horizon on the sand's ground
 * plane, and a sky dome of stars around the camera.
 */
export const DESERT = {
  ground: SAND.ground,
  camera: [0, -1.0, 6] as Vec3,
  target: [0, 6, -40] as Vec3,
  /** Final framing: the camera tilts a little further up, into the stars. */
  finaleCamera: [0.15, -0.9, 5.6] as Vec3,
  finaleTarget: [0.4, 10, -40] as Vec3,
  /** Towards the moon: low from the left, so one face of every crest is lit. */
  moon: normalize([-0.7, 0.45, -0.4]),
  wind: normalize([1, 0, 0.3]),
  skyRadius: 420,
  /**
   * Contact stars as [azimuth from the view heading, elevation] in degrees — kept within
   * a portrait screen's narrow field of view.
   */
  contacts: [
    [-9, 22],
    [2, 31],
    [9, 17],
    [-6, 12],
  ] as const,
};
