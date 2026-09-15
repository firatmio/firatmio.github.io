import { glslCommon } from "../shaders/common";

export const interiorVertexShader = /* glsl */ `
  ${glslCommon}

  attribute vec3 aControl; // stream: bezier control · nucleus: nucleus centre
  attribute vec3 aEnd;     // stream: end point on the membrane
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aBright;
  attribute float aSeed;
  attribute float aKind;   // 0 membrane · 1 cytoplasm · 2 nucleus · 3 stream

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  uniform vec3 uCenter;     // the About neuron, world space
  uniform float uScale;     // world size of the membrane — swells as the camera enters
  uniform float uPresence;  // overall visibility, 0..1
  uniform vec3 uCorePulse;  // the neuron's own period, phase, reliability

  varying vec3 vColor;
  varying float vBright;
  varying float vSeed;
  // Shared fragment shader: the interior is always glowing points.
  varying float vGrain;
  varying float vSolid;

  void main() {
    vGrain = 0.0;
    vSolid = 0.0;
    vec3 local = position;
    float glow = 1.0;

    if (aKind > 2.5) {
      // Cargo streaming out from the nucleus to where the fibres leave the cell.
      float u = fract(aSeed * 7.0 + uTime * (0.05 + aSeed * 0.04));
      float m = 1.0 - u;
      local = m * m * position + 2.0 * m * u * aControl + u * u * aEnd;
      glow = sin(3.14159265 * u);
    } else if (aKind > 1.5) {
      // The nucleus swells with the neuron's own firing.
      vec3 fire = neuronFiring(uTime, uCorePulse.x, uCorePulse.y, uCorePulse.z);
      float d = fire.x - FIRE_LEAD;
      float wave = (d < 0.0 ? exp(-d * d * 40.0) : exp(-d * 2.0)) * fire.y;
      local = aControl + (position - aControl) * (1.0 + 0.03 * sin(uTime * 0.8 + aSeed * 6.0) + wave * 0.08);
      glow = 1.0 + wave * 1.4;
    } else if (aKind > 0.5) {
      // Cytoplasm drifts in slow, private eddies.
      local += 0.035 * vec3(
        sin(uTime * 0.23 + aSeed * 40.0 + position.y * 3.0),
        sin(uTime * 0.19 + aSeed * 23.0 + position.z * 3.0),
        sin(uTime * 0.17 + aSeed * 57.0 + position.x * 3.0)
      );
    } else {
      // The membrane breathes.
      local *= 1.0 + 0.02 * sin(uTime * 0.5 + dot(position, vec3(3.1, 2.3, 1.7)));
    }

    vec3 world = uCenter + local * uScale;
    vec4 mvPosition = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    if (aKind < 0.5) {
      // Rim light: membrane seen edge-on glows like a cell wall under a microscope. The
      // face-on floor stays high enough that, from inside, the wall still reads as a
      // faint speckled enclosure all around.
      vec3 normal = normalize(local);
      vec3 view = normalize(cameraPosition - world);
      glow = 0.45 + 1.6 * pow(1.0 - abs(dot(normal, view)), 2.0);
    }

    float dist = -mvPosition.z;
    float size = aSize * (0.3 + 0.7 * min(uScale, 1.0)) * uSizeScale * uPixelRatio / dist;
    float sprite = max(size, 2.0);
    float energy = min(1.0, (size * size) / (sprite * sprite));

    gl_PointSize = min(sprite, 128.0);
    vColor = aColor;
    vBright = aBright * glow * energy * smoothstep(0.05, 0.3, dist) * uPresence;
    vSeed = aSeed;
  }
`;
