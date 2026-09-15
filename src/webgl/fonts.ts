/** Weight the opening signature is drawn at — heavy, so the extruded letters have body. */
export const SIGNATURE_WEIGHT = 800;

/** The signature's typeface; next/font exposes it on the root element as a CSS variable. */
export function signatureFontFamily(): string {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim();
  return family || getComputedStyle(document.body).fontFamily;
}
