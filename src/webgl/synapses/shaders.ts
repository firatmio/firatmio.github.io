import { glslCommon } from "../shaders/common";

export const synapseVertexShader = /* glsl */ `
  ${glslCommon}

  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute vec3 aPosBrain;
  attribute vec3 aPrevBrain;
  attribute vec3 aNextBrain;
  attribute float aMorph; // wait before moving into the brain state, 0..1
  attribute float aSide;  // -1 | 1
  attribute float aU;     // 0 at the source soma → 1 at the target
  attribute vec3 aColor;
  attribute vec4 aTiming; // source period, phase, reliability, travel seconds
  attribute vec4 aStyle;  // half width (css px), brightness, seed, length (world)

  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uResolution; // drawing buffer px

  varying vec3 vColor;
  varying vec4 vTiming;
  varying vec4 vStyle;
  varying float vU;
  varying float vSide;
  varying float vFade;

  vec4 toClip(vec3 p) {
    return projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }

  void main() {
    // Same warp, same timing as the particles, so fibres stay pinned to their neurons.
    float toBrain = stageBlend(STAGE_ABOUT, STAGE_BRAIN, aMorph);
    vec3 world = coreSwell(tissueState(position, aPosBrain, toBrain, uTime), uTime).xyz;
    vec4 clip = toClip(world);
    vec4 prev = toClip(coreSwell(tissueState(aPrev, aPrevBrain, toBrain, uTime), uTime).xyz);
    vec4 next = toClip(coreSwell(tissueState(aNext, aNextBrain, toBrain, uTime), uTime).xyz);

    // Extrude the ribbon sideways in screen space so width stays in pixels.
    vec2 tangent = (next.xy / next.w - prev.xy / prev.w) * uResolution;
    float tangentLength = length(tangent);
    vec2 dir = tangentLength > 1e-5 ? tangent / tangentLength : vec2(1.0, 0.0);
    vec2 normal = vec2(-dir.y, dir.x);

    // Fibres swell slightly mid-span; the extra 0.75 px keeps the thinnest antialiased.
    float halfWidth = aStyle.x * uPixelRatio * (0.6 + 0.4 * sin(3.14159265 * aU)) + 0.75;
    clip.xy += normal * aSide * halfWidth * 2.0 / uResolution * clip.w;
    gl_Position = clip;

    // Stars have no wiring: fibres dissolve before the tissue flies out to the star field.
    float web = 1.0 - smoothstep(STAGE_BRAIN - 0.01, GALAXY_MORPH_START, uProgress);

    vColor = aColor;
    vTiming = aTiming;
    vStyle = aStyle;
    vU = aU;
    vSide = aSide;
    // Fibres grow in only as the signature has finished settling into the network.
    float grown = smoothstep(STAGE_HERO - 0.03, STAGE_HERO - 0.005, uProgress);
    vFade = depthFade(clip.w) * focusLight(position) * web * enclosureDim(world) * grown;
  }
`;

export const synapseFragmentShader = /* glsl */ `
  ${glslCommon}

  uniform float uTime;

  varying vec3 vColor;
  varying vec4 vTiming;
  varying vec4 vStyle;
  varying float vU;
  varying float vSide;
  varying float vFade;

  void main() {
    if (vFade < 0.001) discard;

    float edge = 1.0 - abs(vSide);
    edge *= edge;

    // Signals leave when the source neuron fires — but not every firing makes it
    // down every fibre.
    vec3 fire = neuronFiring(uTime, vTiming.x, vTiming.y, vTiming.z);
    float transmit = fire.y * step(0.45, hash11(fire.z + vStyle.z * 71.0));
    float head = (fire.x - FIRE_LEAD) / vTiming.w;

    // World units ahead (+) or behind (−) the travelling signal.
    float along = (vU - head) * vStyle.w;
    float pulse = exp(-along * along * 90.0) + (along < 0.0 ? 0.45 * exp(along * 2.5) : 0.0);
    pulse *= transmit;

    vec3 color = mix(vColor, vec3(1.0, 0.93, 0.82), min(pulse, 1.0));
    gl_FragColor = vec4(color * (vStyle.y + pulse * 2.4) * edge * vFade, 1.0);
  }
`;
