import { AddEquation, CustomBlending, OneFactor, OneMinusSrcAlphaFactor } from "three";
import { glslCommon } from "../shaders/common";
import { glslSignature } from "../signature/glsl";
import { LOGO_PALETTE_SIZE } from "./targets/desert";

/**
 * How particle fragments combine: premultiplied "over". A glowing point writes no alpha,
 * so it only adds light; a settled sand grain writes its coverage, so it also hides what
 * was drawn behind it (the field is drawn far to near from the sand camera — see
 * ParticleField).
 */
export const particleBlending = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: OneFactor,
  blendDst: OneMinusSrcAlphaFactor,
} as const;

export const particleVertexShader = /* glsl */ `
  ${glslCommon}
  ${glslSignature}

  attribute vec3 aColor;
  // size, brightness, seed, contact-logo colour — packed into one slot: every scene state
  // costs attributes, and GPUs only guarantee 16.
  attribute vec4 aTraits;
  #define aSize aTraits.x
  #define aBright aTraits.y
  #define aSeed aTraits.z
  // 0 outside the contact logos, else its colour (uLogoPalette index + 1), +0.5 on a seed star.
  #define aLogoTone aTraits.w
  attribute vec4 aPulse;     // period (0 = free twinkle), phase, arbor position, reliability
  attribute vec4 aPosSig;    // opening signature position (xyz), its brightness (w)
  attribute vec3 aPosBrain;
  attribute vec3 aPosGalaxy;
  attribute vec4 aStar;      // galaxy colour (rgb), brightness/size boost (w)
  attribute vec3 aPosSand;
  attribute vec4 aSand;      // lit grain colour (rgb), grain size (w)
  attribute vec4 aPosDesert; // xyz; w = its place in the contact logos, floor(u · 4095) + v
  attribute vec4 aDesert;    // lit colour (rgb), world size (w)
  attribute vec4 aMorph;     // wait before brain, galaxy, sand; w = desert kind + its wait

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale; // viewport height (css px) / (2 * tan(fov / 2))
  // The finale's contact logos stand on a plane: origin + axisU · u + axisV · v.
  uniform vec3 uLogoOrigin;
  uniform vec3 uLogoAxisU;
  uniform vec3 uLogoAxisV;
  uniform vec2 uLogoCells[4]; // each logo's middle (u, v): top left, top right, bottom left, bottom right
  uniform vec3 uLogoPalette[${LOGO_PALETTE_SIZE}];
  uniform float uLogoGrain;   // world size of a logo star
  uniform float uLogoGlow[4]; // each logo's hover glow, eased in and out, 0..1

  varying vec3 vColor;
  varying float vBright;
  varying float vSeed;
  varying float vGrain;
  varying float vSolid;

  void main() {
    // Letters dissolve roughly left to right, each particle on its own beat.
    float sigDelay = fract(aSeed * 7.13) * 0.65 + clamp(aPosSig.x / 8.0 + 0.5, 0.0, 1.0) * 0.35;
    float toNetwork = stageBlend(SIGNATURE_MORPH_START, STAGE_HERO, sigDelay);
    float toBrain = stageBlend(STAGE_ABOUT, STAGE_BRAIN, aMorph.x);
    float toGalaxy = stageBlend(GALAXY_MORPH_START, STAGE_GALAXY, aMorph.y);
    float toSand = stageBlend(SAND_MORPH_START, STAGE_SAND, aMorph.z);
    float desertKind = floor(aMorph.w);
    float toDesert = stageBlend(DESERT_MORPH_START, STAGE_DESERT, fract(aMorph.w));
    float isSky = step(0.5, desertKind) * (1.0 - step(1.5, desertKind));
    float isDrift = step(1.5, desertKind);

    // The signature's dust shimmers and answers the cursor's trail (see glslSignature).
    vec3 sig = signaturePosition(aPosSig.xyz, aSeed, uTime);

    // The About neuron's swelling acts on the tissue itself, so its fibres stay attached.
    vec4 swell = coreSwell(tissueState(position, aPosBrain, toBrain, uTime), uTime);
    // On the first scroll the letters burst apart and settle into the network.
    vec3 scatter = vec3(sin(aSeed * 23.0), cos(aSeed * 41.0), sin(aSeed * 67.0));
    vec3 tissue = mix(sig, swell.xyz, toNetwork) + scatter * sin(3.14159265 * toNetwork) * 2.2;
    vec3 star = rotateGalaxy(aPosGalaxy, uTime);
    // Each particle takes its own detour on the long flight out — the fibres are gone by then.
    vec3 detour = vec3(sin(aSeed * 43.0), cos(aSeed * 71.0), sin(aSeed * 19.0 + 1.0));
    vec3 p = mix(tissue, star, toGalaxy) + detour * sin(3.14159265 * toGalaxy) * 1.4;
    // The disc drains in a swirl and settles as sand.
    vec3 drain = cross(GALAXY_AXIS, star - GALAXY_CENTER) * sin(3.14159265 * toSand) * 0.35;
    p = mix(p, aPosSand, toSand) + drain;

    // Night desert: most grains spread out into the dunes, the rest rise and become stars.
    vec3 desert = aPosDesert.xyz;
    // Spindrift — the wind lifts grains off the crests in slow gusts and lets them fall.
    float gust = fract(uTime * 0.12 + aSeed * 7.0);
    desert += isDrift * (DESERT_WIND * gust * 2.5 + vec3(0.0, sin(3.14159265 * gust) * 0.35, 0.0));
    vec3 rise = vec3(0.0, sin(3.14159265 * toDesert) * mix(0.6, 6.0, isSky), 0.0);
    p = mix(p, desert, toDesert) + rise;

    // Finale: stars stream together into the contact logos — each funnelling through its
    // logo's contact star, which arrives first, then spreading out into the mark.
    float logoTone = floor(aLogoTone);
    float inLogo = step(0.5, logoTone);
    float isSeed = step(0.25, fract(aLogoTone));
    float toLogo = inLogo * stageBlend(LOGO_MORPH_START, LOGO_MORPH_END, (1.0 - isSeed) * (0.15 + 0.85 * fract(aSeed * 23.7)));
    vec2 logoUV = vec2(floor(aPosDesert.w) / 4095.0, fract(aPosDesert.w));
    int cell = int(step(0.5, logoUV.x) + 2.0 * (1.0 - step(0.5, logoUV.y)));
    vec3 logoAt = uLogoOrigin + uLogoAxisU * logoUV.x + uLogoAxisV * logoUV.y;
    // Formed, each star still breathes a hair around its place.
    logoAt += (normalize(uLogoAxisU) * sin(uTime * 0.7 + aSeed * 40.0) + normalize(uLogoAxisV) * cos(uTime * 0.6 + aSeed * 23.0)) * uLogoGrain * 0.3;
    vec3 seedAt = uLogoOrigin + uLogoAxisU * uLogoCells[cell].x + uLogoAxisV * uLogoCells[cell].y;
    float e = toLogo;
    p = mix(p, (1.0 - e) * (1.0 - e) * p + 2.0 * (1.0 - e) * e * seedAt + e * e * logoAt, inLogo);

    // Pushed on past them, the logos burst one after another, like fireworks: a flash, then
    // their stars flung out in a shell that slows as it spreads and fades to dust.
    float burstT = clamp((uProgress - LOOP_EXPLODE_START) / (LOOP_EXPLODE_END - LOOP_EXPLODE_START), 0.0, 1.0);
    float burstAge = inLogo * clamp((burstT - float(cell) * 0.12 - fract(aSeed * 17.9) * 0.05) / 0.5, 0.0, 1.0);
    float fly = 1.0 - pow(1.0 - burstAge, 3.0);
    float flash = burstAge > 0.0 ? exp(-burstAge * 7.0) : 0.0;
    vec3 jitter = vec3(hash11(aSeed * 13.1), hash11(aSeed * 7.7), hash11(aSeed * 3.3)) - 0.5;
    vec3 shell = normalize(normalize(logoAt - seedAt + 1e-4) * 0.9 + jitter * 1.6);
    float reach = length(uLogoAxisU) * (0.25 + 0.55 * hash11(aSeed * 29.3));
    p += (shell * fly - normalize(uLogoAxisV) * 0.15 * fly * fly) * reach * inLogo;

    // Then all of it — the logos' dust, the sky, the dunes — drifts back into the
    // signature, and the journey begins again from the top.
    float toReturn = stageBlend(LOOP_GATHER_START, LOOP_END, fract(aSeed * 31.7));
    p = mix(p, sig, toReturn) + scatter * sin(3.14159265 * toReturn) * 2.2;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float glow;
    float grow = 1.0;
    if (aPulse.x > 0.0) {
      vec3 fire = neuronFiring(uTime, aPulse.x, aPulse.y, aPulse.w);
      // The firing peaks at the soma, then rolls outward along the arbor.
      float d = fire.x - FIRE_LEAD - aPulse.z * ARBOR_TRAVEL;
      float wave = (d < 0.0 ? exp(-d * d * 40.0) : exp(-d * 2.4)) * fire.y;
      float breath = 0.88 + 0.12 * sin(uTime * 6.2831 / (aPulse.x * 1.7) + aPulse.y * 6.2831);
      glow = breath + wave * (1.9 - aPulse.z);
      grow += wave * 0.3 * (1.0 - aPulse.z);
    } else {
      glow = 0.65 + 0.35 * sin(uTime * (0.4 + aSeed * 1.3) + aSeed * 57.0);
    }
    float sigGlow = signatureGlow(aSeed, uTime);
    glow = mix(sigGlow, glow, toNetwork);
    // Stars twinkle; they don't fire.
    float twinkle = 0.7 + 0.3 * sin(uTime * (0.6 + aSeed * 2.1) + aSeed * 40.0);
    glow = mix(glow, twinkle, toGalaxy);
    grow = mix(grow, 1.0 + aStar.w * 0.5, toGalaxy);
    // Sand lies still; now and then a quartz facet catches the sun.
    float glint = pow(max(sin(uTime * 0.7 + aSeed * 120.0), 0.0), 60.0) * 3.0;
    glow = mix(glow, 1.0 + glint, toSand);
    // Night sky stars twinkle; drifting grains fade in and out with their gust.
    float starTwinkle = 0.75 + 0.25 * sin(uTime * (0.8 + aSeed * 2.5) + aSeed * 90.0);
    float driftFade = mix(1.0, sin(3.14159265 * gust), isDrift);
    glow = mix(glow, mix(1.0, starTwinkle, isSky) * driftFade, toDesert);
    // In a logo each star twinkles on its own beat; the logo under the pointer brightens.
    float logoTwinkle = 0.8 + 0.2 * sin(uTime * (0.9 + aSeed * 2.0) + aSeed * 70.0);
    glow = mix(glow, logoTwinkle * (1.0 + 0.6 * uLogoGlow[cell]), toLogo);
    // The burst: a white-hot flash, then the flung stars dim to dust.
    glow *= (1.0 + 4.0 * flash) * (1.0 - 0.65 * smoothstep(0.3, 1.0, burstAge));

    float sigBright = aPosSig.w;
    float sigSize = signatureSize(sigBright, aSeed);
    vec3 sigColor = signatureColor(aColor);

    float dist = -mvPosition.z;
    float tissueSize = mix(sigSize, aSize * grow, toNetwork);
    float worldSize = mix(mix(tissueSize, aSand.w, toSand), aDesert.w, toDesert);
    worldSize = mix(worldSize, uLogoGrain * (0.8 + 0.4 * fract(aSeed * 5.1)), toLogo);
    worldSize *= 1.0 + 1.5 * flash;
    worldSize = mix(worldSize, sigSize, toReturn);
    float size = worldSize * uSizeScale * uPixelRatio / dist;

    // Keep sub-pixel points from shimmering: clamp the sprite but conserve energy.
    float sprite = max(size, 2.0);
    float energy = min(1.0, (size * size) / (sprite * sprite));

    // Cap so particles the camera flies past don't flood the screen.
    gl_PointSize = min(sprite, 256.0);
    vec3 tissueColor = mix(sigColor, aColor, toNetwork);
    vColor = mix(mix(mix(tissueColor, aStar.rgb, toGalaxy), aSand.rgb, toSand), aDesert.rgb, toDesert);
    // Each logo in its platform's own colours (brightness baked into the palette).
    vColor = mix(vColor, uLogoPalette[int(max(logoTone - 1.0, 0.0))], toLogo);
    vColor = mix(vColor, vec3(1.0, 0.95, 0.88), flash * 0.8);
    vColor = mix(vColor, sigColor, toReturn);
    // Sand, dunes and night-sky stars carry their lighting in their colour.
    float tissueBright = mix(sigBright, aBright, toNetwork);
    float intensity = mix(tissueBright * mix(1.0, aStar.w, toGalaxy), 1.0, max(toSand, toDesert)) * glow;
    // Back in the signature, exactly as the journey began — so the jump to the top is seamless.
    intensity = mix(intensity, sigBright * sigGlow, toReturn);
    vBright = intensity * energy * depthFade(dist) * focusLight(position) * enclosureDim(p) * (1.0 - swell.w);
    vSeed = aSeed;
    // Grains on the ground stay solid; grains that rose into the sky glow again as stars.
    vGrain = toSand * (1.0 - toDesert * isSky) * (1.0 - toReturn);
    // Settled sand is solid matter: it hides what lies behind it — once a grain has landed,
    // until the desert lifts it again. Near the lens the grains stay soft and let light
    // through, like out-of-focus dust.
    vSolid = toSand * toSand * toSand * (1.0 - toDesert) * (1.0 - toReturn) * smoothstep(1.0, 2.2, dist);
  }
`;

export const particleFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBright;
  varying float vSeed;
  varying float vGrain; // 0 = glowing point, 1 = solid sand grain
  varying float vSolid; // how much a grain covers what lies behind it

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;

    // Slightly lumpy outline per particle — only noticeable on the large ones.
    float angle = atan(uv.y, uv.x);
    d *= 1.0 + 0.07 * sin(angle * 3.0 + vSeed * 6.2831) + 0.04 * sin(angle * 5.0 - vSeed * 11.0);

    float core = exp(-d * d * 7.0);
    float halo = 0.16 * exp(-d * d * 1.8);
    float glowAlpha = (core + halo) * smoothstep(1.0, 0.7, d);
    // A sand grain is a solid, soft-edged body rather than a glow — a tiny pebble, lit on
    // the side facing the low sun (upper left on screen; gl_PointCoord's y runs down) and
    // in its own shade on the other.
    float grainAlpha = smoothstep(1.0, 0.6, d) * (0.8 + 0.2 * (1.0 - d * d));
    float facing = dot(uv * 2.0, vec2(-0.6, -0.55));
    float pebble = mix(1.0, 0.8 + 0.45 * facing, vGrain);
    float alpha = mix(glowAlpha, grainAlpha, vGrain);
    if (alpha < 0.002) discard;

    // Premultiplied: see particleBlending.
    gl_FragColor = vec4(vColor * vBright * pebble * alpha, grainAlpha * vSolid);
  }
`;
