import type { Vector3 } from "three";
import { DESERT, GALAXY } from "../layout";
import { CONTACT_LOGOS, LOOP, STAGES } from "../stages";

const glslFloat = (value: number) => value.toFixed(4);
const glslVec3 = (v: readonly number[]) => `vec3(${v.map(glslFloat).join(", ")})`;

/**
 * GLSL shared by every shader that draws the neural tissue. Particles and synapse
 * ribbons must agree on timing, drift and morphing, or fibres detach from their neurons.
 */
export const glslCommon = /* glsl */ `
  // Seconds between the start of a firing cycle and the soma's peak.
  const float FIRE_LEAD = 0.35;
  // Seconds for a firing to roll from the soma to the dendrite tips.
  const float ARBOR_TRAVEL = 1.4;

  const float STAGE_HERO = ${glslFloat(STAGES.hero)};
  // The signature holds until the first nudge of the wheel, then scatters into the network.
  const float SIGNATURE_MORPH_START = 0.006;
  const float STAGE_ABOUT = ${glslFloat(STAGES.about)};
  const float STAGE_BRAIN = ${glslFloat(STAGES.brain)};
  const float STAGE_GALAXY = ${glslFloat(STAGES.galaxy)};
  // The flight out to the stars starts a beat after the brain stop, once the fibres are gone.
  const float GALAXY_MORPH_START = STAGE_BRAIN + 0.03;
  const float STAGE_SAND = ${glslFloat(STAGES.sand)};
  // The disc holds a beat at the galaxy stop before it starts draining into sand.
  const float SAND_MORPH_START = STAGE_GALAXY + 0.02;
  const float STAGE_DESERT = ${glslFloat(STAGES.desert)};
  // Grains start lifting off a beat after the sand has settled.
  const float DESERT_MORPH_START = STAGE_SAND + 0.015;
  // Over the last stretch the closing sky's stars gather into the contact logos.
  const float LOGO_MORPH_START = ${glslFloat(CONTACT_LOGOS.start)};
  const float LOGO_MORPH_END = ${glslFloat(CONTACT_LOGOS.end)};
  // Past them the logos burst, and all the dust gathers back into the signature.
  const float LOOP_EXPLODE_START = ${glslFloat(LOOP.explodeStart)};
  const float LOOP_EXPLODE_END = ${glslFloat(LOOP.explodeEnd)};
  const float LOOP_GATHER_START = ${glslFloat(LOOP.gatherStart)};
  const float LOOP_END = ${glslFloat(LOOP.end)};
  const vec3 DESERT_WIND = ${glslVec3(DESERT.wind)};

  const vec3 GALAXY_CENTER = ${glslVec3(GALAXY.center)};
  const vec3 GALAXY_AXIS = ${glslVec3(GALAXY.axis)};
  const float GALAXY_RADIUS = ${glslFloat(GALAXY.radius)};

  uniform float uProgress;  // scroll journey, 0..1
  uniform float uHazeStart; // view distance at which atmospheric haze sets in

  float hash11(float n) {
    return fract(sin(n * 91.3458) * 47453.5453);
  }

  // Every neuron has its own period and phase, and each cycle draws its own strength,
  // so no neuron settles into a visible loop and the population never syncs up.
  // Returns (seconds into the current cycle, strength of this firing 0..1, cycle index).
  vec3 neuronFiring(float time, float period, float phase, float reliability) {
    float cycle = time / period + phase;
    float index = floor(cycle);
    float strength = max(smoothstep(0.3, 1.0, hash11(index + phase * 157.0)), reliability);
    return vec3(fract(cycle) * period, strength, index);
  }

  // The two phase offsets of a particle's lumpy outline, as cos/sin pairs, so the fragment
  // shader can shape it with plain arithmetic instead of atan and sin on every pixel.
  vec4 lumpPhase(float seed) {
    return vec4(cos(seed * 6.2831), sin(seed * 6.2831), cos(seed * 11.0), -sin(seed * 11.0));
  }

  // Slow, spatially coherent swell of the whole tissue — breathing, not jitter.
  vec3 tissueDrift(vec3 p, float time) {
    return vec3(
      sin(p.y * 0.55 + time * 0.21) + 0.5 * sin(p.z * 0.4 + time * 0.13 + 1.7),
      sin(p.x * 0.48 - time * 0.17 + 0.6) + 0.5 * sin(p.z * 0.37 - time * 0.11),
      0.6 * sin(p.x * 0.31 + p.y * 0.29 + time * 0.15)
    ) * 0.035;
  }

  // Weight of a scene state across a scroll window. Each vertex waits its own share of
  // the window (delay, 0..1), so the change ripples through instead of snapping.
  float stageBlend(float from, float to, float delay) {
    float t = clamp((uProgress - from) / (to - from), 0.0, 1.0);
    float k = clamp((t - delay * 0.4) / 0.6, 0.0, 1.0);
    return k * k * (3.0 - 2.0 * k);
  }

  // Neuron map → brain tissue, travelling in arcs. The detour depends on position alone,
  // so neighbouring particles and fibres bend together and stay attached.
  vec3 tissueState(vec3 neuron, vec3 brain, float toBrain, float time) {
    vec3 swirl = vec3(sin(neuron.y * 0.4 + 1.3), sin(neuron.z * 0.5 + neuron.x * 0.2), sin(neuron.x * 0.35 - 0.7));
    vec3 p = mix(neuron, brain, toBrain) + swirl * sin(3.14159265 * toBrain) * 0.3;
    return p + tissueDrift(p, time);
  }

  // Slow rotation of the star field around its axis; the inner disc turns a little faster.
  vec3 rotateGalaxy(vec3 p, float time) {
    vec3 v = p - GALAXY_CENTER;
    float angle = time * 0.01 * (1.2 - 0.4 * min(length(v) / GALAXY_RADIUS, 1.0));
    float c = cos(angle);
    float s = sin(angle);
    return GALAXY_CENTER + v * c + cross(GALAXY_AXIS, v) * s + GALAXY_AXIS * dot(GALAXY_AXIS, v) * (1.0 - c);
  }

  // Atmospheric falloff beyond the subject, and soften anything drifting into the lens.
  float depthFade(float dist) {
    return exp(-max(dist - uHazeStart, 0.0) * 0.08) * smoothstep(0.25, 1.4, dist);
  }

  // Spotlight around the selected project neuron; the rest of the tissue recedes.
  uniform vec3 uFocus;
  uniform float uFocusMix;

  float focusLight(vec3 p) {
    vec3 d = p - uFocus;
    return mix(1.0, 0.3 + 1.15 * exp(-dot(d, d) * 0.3), uFocusMix);
  }

  // While the camera is inside the About neuron, tissue beyond its membrane is seen
  // dimly through the wall instead of looming as huge out-of-focus blobs.
  uniform vec3 uEnclosureCenter;
  uniform float uEnclosureRadius;
  uniform float uEnclosure;

  float enclosureDim(vec3 p) {
    float outside = smoothstep(uEnclosureRadius * 0.85, uEnclosureRadius * 1.1, distance(p, uEnclosureCenter));
    return mix(1.0, 0.3, outside * uEnclosure);
  }

  uniform float uSomaRadius; // the About neuron's resting radius
  uniform float uSwallow;    // 0..1: its own nucleus and body handing over to the interior

  // The About neuron inflating around the camera. Tissue around it is pushed outward —
  // hardest right at the soma — so its own dendrites and fibres stay rooted in the growing
  // membrane. w: how much of the point has been absorbed into the interior.
  vec4 coreSwell(vec3 p, float time) {
    vec3 center = uEnclosureCenter + tissueDrift(uEnclosureCenter, time);
    vec3 d = p - center;
    float r = length(d);
    float absorbed = (1.0 - smoothstep(uSomaRadius * 1.1, uSomaRadius * 1.5, r)) * uSwallow;
    float grow = max(uEnclosureRadius - uSomaRadius, 0.0);
    if (grow <= 0.0 || r < 1e-4) return vec4(p, absorbed);
    float push = grow * exp(-max(r - uSomaRadius, 0.0) / 1.2);
    return vec4(p + d / r * push, absorbed);
  }
`;

/** State of the About neuron's swelling, shared by the tissue and fibre materials. */
export interface Enclosure {
  center: Vector3;
  /** Current world radius of its membrane. */
  radius: number;
  somaRadius: number;
  /** 0..1 — how far the tissue beyond the membrane recedes. */
  dim: number;
  /** 0..1 — how far its nucleus and body have handed over to the interior. */
  swallow: number;
}

/** CPU mirror of the GLSL `tissueDrift` — keep the two in sync so picking tracks the hubs. */
export function tissueDrift(x: number, y: number, z: number, time: number): [number, number, number] {
  return [
    (Math.sin(y * 0.55 + time * 0.21) + 0.5 * Math.sin(z * 0.4 + time * 0.13 + 1.7)) * 0.035,
    (Math.sin(x * 0.48 - time * 0.17 + 0.6) + 0.5 * Math.sin(z * 0.37 - time * 0.11)) * 0.035,
    0.6 * Math.sin(x * 0.31 + y * 0.29 + time * 0.15) * 0.035,
  ];
}
