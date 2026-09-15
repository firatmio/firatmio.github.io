import { HalfFloatType, type Camera, type Scene, type WebGLRenderer } from "three";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import type { Quality } from "./quality";

/**
 * The look every scene shares: bloom on the bright dust, AgX tone mapping, a vignette and
 * film grain.
 */
export function createPostProcessing(renderer: WebGLRenderer, scene: Scene, camera: Camera, tier: Quality["tier"]) {
  const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new BloomEffect({
    mipmapBlur: true,
    luminanceThreshold: 0.4,
    luminanceSmoothing: 0.3,
    intensity: 1.1,
    radius: 0.6,
    levels: tier === "low" ? 4 : 6,
  });
  const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.AGX });
  const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.7 });
  const grain = new NoiseEffect({ premultiply: true });
  grain.blendMode.opacity.value = 0.4;
  composer.addPass(new EffectPass(camera, bloom, toneMapping, vignette, grain));

  return { composer, effects: { bloom, toneMapping, vignette, grain } };
}
