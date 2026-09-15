/**
 * GLSL for the signature's dust, shared by the journey's particle field and the standalone
 * signature scene (the 404 page), so both breathe and answer the cursor alike.
 */
export const glslSignature = /* glsl */ `
  uniform sampler2D uTrail;  // where the cursor has swept: intensity (r), swipe direction (gb)
  uniform vec4 uTrailBounds; // world rect the trail covers: min x, min y, width, height

  // The dust shimmers in place. Where the cursor has swept, the letters' grains are flung
  // along the stroke — each at its own angle and strength — and drift back as the trail
  // fades.
  vec3 signaturePosition(vec3 home, float seed, float time) {
    vec3 sig = home + vec3(sin(time * 0.6 + seed * 31.0), cos(time * 0.5 + seed * 17.0), 0.0) * 0.012;
    vec4 trail = texture2D(uTrail, (home.xy - uTrailBounds.xy) / uTrailBounds.zw);
    // Only the letters answer, not the dust far behind them.
    float onLetters = 1.0 - smoothstep(0.4, 0.8, abs(home.z - 0.1));
    float disturbed = smoothstep(0.0, 1.0, trail.r) * onLetters;
    vec2 swipe = length(trail.gb) > 1e-4 ? normalize(trail.gb) : vec2(0.0, 1.0);
    float jolt = 0.4 + fract(seed * 13.7);
    float veer = (fract(seed * 29.3) - 0.5) * 2.4;
    vec2 fling = vec2(swipe.x * cos(veer) - swipe.y * sin(veer), swipe.x * sin(veer) + swipe.y * cos(veer));
    sig.xy += fling * disturbed * jolt * 0.35;
    sig.z += (fract(seed * 51.1) - 0.3) * disturbed * 0.3;
    return sig;
  }

  // The signature doesn't fire — it only shimmers.
  float signatureGlow(float seed, float time) {
    return 0.85 + 0.15 * sin(time * (0.7 + seed) + seed * 50.0);
  }

  // Every particle is the same kind of fine, pale dust; brighter grains a touch larger.
  float signatureSize(float bright, float seed) {
    return mix(0.012, 0.034, smoothstep(0.1, 1.0, bright)) * (0.75 + 0.5 * fract(seed * 3.7));
  }

  vec3 signatureColor(vec3 tint) {
    return mix(vec3(0.82, 0.9, 1.0), tint, 0.3);
  }
`;
