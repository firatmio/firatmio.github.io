"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNATURE_WEIGHT, signatureFontFamily } from "@/webgl/fonts";
import { supportsWebGL2 } from "@/webgl/quality";
import type { SignatureScene } from "@/webgl/signature/SignatureScene";
import LoadingDust from "./LoadingDust";

/** The journey's opening signature on its own, spelling `text` in the same luminous dust. */
export default function SignatureCanvas({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** The first frame is drawn — the dust fades in, the loader out. */
  const [ready, setReady] = useState(false);
  /** No WebGL here: the text is set in the signature's typeface instead. */
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let scene: SignatureScene | null = null;

    // Load three.js lazily so the HTML shell paints before the WebGL bundle arrives.
    import("@/webgl/signature/SignatureScene").then(async ({ SignatureScene }) => {
      // The letters are rasterised from their typeface — wait until it has really loaded.
      await document.fonts.load(`${SIGNATURE_WEIGHT} 64px ${signatureFontFamily()}`).catch(() => undefined);
      if (disposed) return;
      if (!supportsWebGL2()) {
        setFailed(true);
        return;
      }
      try {
        scene = new SignatureScene(canvas, text, () => setReady(true));
      } catch (error) {
        console.warn("WebGL signature failed to start", error);
        setFailed(true);
      }
    });

    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [text]);

  if (failed) {
    return (
      <p
        aria-hidden
        className="pointer-events-none fixed inset-0 grid place-items-center font-(family-name:--font-fraunces) text-[clamp(5rem,20vw,12rem)] font-extrabold text-ink/85"
      >
        {text}
      </p>
    );
  }
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className={`fixed inset-0 block h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      />
      <LoadingDust done={ready} />
    </>
  );
}
