"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/content/projects";
import { QUACOMES_LOGO } from "@/content/quacomes-logo";
import type { Experience, ExperienceCallbacks, HubAnchor } from "@/webgl/Experience";
import { SIGNATURE_WEIGHT, signatureFontFamily } from "@/webgl/fonts";
import { smoothstep } from "@/webgl/math";
import { supportsWebGL2 } from "@/webgl/quality";
import { LOOP, aboutBeats, aboutReveal, contactReveal } from "@/webgl/stages";
import AboutOverlay from "./AboutOverlay";
import ContactStars from "./ContactStars";
import HubLabel from "./HubLabel";
import JourneyMap, { updateJourneyMap } from "./JourneyMap";
import LoadingMark from "./LoadingMark";
import ProjectCard from "./ProjectCard";
import StaticJourney from "./StaticJourney";

/** How far the screen's shape may drift from the one the scene was laid out for before it's rebuilt. */
const RELAYOUT_ASPECT = 1.15;
/** Seconds for the eased journey to close ~63% of the gap to where the scroll is. */
const SCROLL_EASE = 0.35;
/** Css px short of the bottom that an upward loop lands on. */
const SEAM_GAP = 8;

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const signatureHintRef = useRef<HTMLParagraphElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLAnchorElement>(null);
  const experienceRef = useRef<Experience | null>(null);
  const progressRef = useRef(0);
  const [hovered, setHovered] = useState<HubAnchor | null>(null);
  const [selected, setSelected] = useState<HubAnchor | null>(null);
  const [explored, setExplored] = useState(false);
  const [interactive, setInteractive] = useState(false);
  /** The journey can't run here — show everything it holds as a plain page instead. */
  const [fallback, setFallback] = useState(false);
  /** Bumped to rebuild the scene, on a fresh canvas, when the screen changes shape. */
  const [layout, setLayout] = useState(0);
  /** The scene's first frame is drawn — it fades in, the loader out. */
  const [ready, setReady] = useState(false);
  const journeyRef = useRef<HTMLElement>(null);
  const selectedSlug = selected?.slug ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || fallback) return;

    let disposed = false;
    const callbacks: ExperienceCallbacks = {
      onHover: setHovered,
      onSelect: (hub) => {
        setSelected(hub);
        if (hub) setExplored(true);
      },
      onInteractiveChange: (value) => {
        setInteractive(value);
        if (!value) {
          setSelected(null);
          setHovered(null);
        }
      },
      // Lay each contact link over its logo in the sky — straight to the DOM, every frame.
      onContactFrame: (rects) => {
        const anchors = contactRef.current?.querySelectorAll<HTMLElement>("[data-contact]");
        if (!anchors) return;
        rects.forEach((rect, i) => {
          const anchor = anchors[i];
          if (!anchor) return;
          anchor.style.visibility = rect ? "" : "hidden";
          if (!rect) return;
          anchor.style.translate = `${rect.left}px ${rect.top}px`;
          anchor.style.width = `${rect.width}px`;
          anchor.style.height = `${rect.height}px`;
        });
      },
      // Lay the Quacomes link over the mark on the sand — straight to the DOM, every frame.
      onMarkFrame: (rect) => {
        const link = markRef.current;
        if (!link) return;
        link.style.visibility = rect ? "visible" : "hidden";
        if (!rect) return;
        link.style.translate = `${rect.left}px ${rect.top}px`;
        link.style.width = `${rect.width}px`;
        link.style.height = `${rect.height}px`;
      },
      onContextLost: () => setFallback(true),
      onReady: () => setReady(true),
    };

    // Load three.js lazily so the HTML shell paints before the WebGL bundle arrives.
    import("@/webgl/Experience").then(async ({ Experience }) => {
      // The signature is rasterised from its typeface — wait until that has really loaded.
      await document.fonts.load(`${SIGNATURE_WEIGHT} 64px ${signatureFontFamily()}`).catch(() => undefined);
      if (disposed) return;
      if (!supportsWebGL2()) {
        setFallback(true);
        return;
      }
      try {
        const experience = new Experience(canvas, callbacks);
        experience.setProgress(progressRef.current);
        experienceRef.current = experience;
      } catch (error) {
        console.warn("WebGL experience failed to start", error);
        setFallback(true);
      }
    });

    return () => {
      disposed = true;
      experienceRef.current?.dispose();
      experienceRef.current = null;
    };
  }, [fallback, layout]);

  // The scene's targets are laid out for the screen's shape at load. When it changes a lot
  // — a phone turned on its side, a window dragged far wider — rebuild it for the new one.
  // Small changes, like a mobile browser's toolbar sliding away, are left alone.
  useEffect(() => {
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const experience = experienceRef.current;
        if (!experience) return;
        const aspect = window.innerWidth / Math.max(1, window.innerHeight);
        if (Math.abs(Math.log(aspect / experience.layoutAspect)) < Math.log(RELAYOUT_ASPECT)) return;
        setSelected(null);
        setHovered(null);
        setReady(false);
        setLayout((n) => n + 1);
      }, 400);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Scroll is the timeline, eased so the camera trails the wheel instead of jerking with
  // it. And it loops, both ways: past the end the dust gathers back into the signature and
  // the page quietly jumps to the top — onto the very same frame — so scrolling on begins
  // again; pushing up from the signature jumps to the bottom, and the loop runs backwards
  // into the contact logos.
  useEffect(() => {
    if (fallback) return;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const targetOf = () => {
      const max = maxScroll();
      return max > 0 ? (window.scrollY / max) * LOOP.end : 0;
    };
    let eased = targetOf();
    // Each jump carries the eased position over the seam, so the frame stays where it was.
    const wrapDown = () => {
      window.scrollTo(0, 0);
      eased -= LOOP.end;
    };
    const wrapUp = () => {
      const max = maxScroll();
      if (max <= SEAM_GAP) return;
      // Just short of the very bottom, so the jump doesn't wrap straight back down.
      window.scrollTo(0, max - SEAM_GAP);
      eased += LOOP.end;
    };

    // At the top there's nowhere left to scroll, so read the intent itself: a wheel, a
    // swipe or a key pushing upwards takes the loop backwards.
    const atTop = () => window.scrollY <= 0;
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0 && atTop()) wrapUp();
    };
    let touchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0;
      if (y - touchY > 12 && atTop()) wrapUp();
      touchY = y;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const up = event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey);
      if (up && atTop()) wrapUp();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    let applied = -1;
    let last = performance.now();
    let frame = 0;

    // Written straight to the DOM — no React render per scroll frame.
    const apply = (progress: number) => {
      if (Math.abs(progress - applied) < 1e-5) return;
      applied = progress;
      progressRef.current = progress;
      experienceRef.current?.setProgress(progress);
      updateJourneyMap(journeyRef.current, progress);
      const signatureHint = signatureHintRef.current;
      if (signatureHint) {
        // Fading as the journey leaves the signature, and back as the loop returns to it.
        const shown = Math.max(1 - smoothstep(0, 0.02, progress), smoothstep(LOOP.end - 0.02, LOOP.end, progress));
        signatureHint.style.opacity = String(shown);
      }
      const contactSection = contactRef.current;
      if (contactSection) {
        const reveal = contactReveal(progress);
        contactSection.style.setProperty("--reveal", reveal.toFixed(3));
        // Hidden entirely while faded out, so its links drop out of the tab order.
        contactSection.style.visibility = reveal < 0.02 ? "hidden" : "visible";
      }
      const aboutSection = aboutRef.current;
      if (aboutSection) {
        aboutSection.style.setProperty("--reveal", aboutReveal(progress).toFixed(3));
        aboutBeats(progress).forEach((beat, i) => aboutSection.style.setProperty(`--beat-${i}`, beat.toFixed(3)));
      }
    };

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      // The very bottom: close the loop.
      const max = maxScroll();
      if (max > SEAM_GAP && window.scrollY >= max - 1) wrapDown();
      eased += (targetOf() - eased) * (1 - Math.exp(-delta / SCROLL_EASE));
      apply(((eased % LOOP.end) + LOOP.end) % LOOP.end);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fallback]);

  // The WebGL spotlight follows whichever card is open.
  useEffect(() => {
    experienceRef.current?.setFocus(selectedSlug);
  }, [selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    const onResize = () => setSelected(experienceRef.current?.hubAnchor(selectedSlug) ?? null);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [selectedSlug]);

  const openFromList = (slug: string) => {
    setSelected(
      experienceRef.current?.hubAnchor(slug) ?? {
        slug,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        radius: 0,
      },
    );
    setExplored(true);
  };

  if (fallback) return <StaticJourney />;

  return (
    <>
      <canvas
        key={layout}
        ref={canvasRef}
        aria-hidden
        className={`fixed inset-0 block h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      />
      <LoadingMark done={ready} />
      <JourneyMap ref={journeyRef} />

      {/* The scroll track: its height is the length of the journey, loop included. */}
      <div
        aria-hidden
        className="pointer-events-none relative"
        style={{ height: `calc(${LOOP.end} * 1200svh + 100svh)` }}
      />

      <p className="pointer-events-none fixed top-6 left-6 font-mono text-xs tracking-[0.2em] text-ink/60 uppercase">
        Fırat Tuna Arslan
      </p>

      <AboutOverlay ref={aboutRef} />
      <ContactStars ref={contactRef} onHover={(index) => experienceRef.current?.setContactHover(index)} />

      {/* The Quacomes mark standing on the sand links out, laid over it while it's formed. */}
      <a
        ref={markRef}
        href={QUACOMES_LOGO.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Quacomes (opens in a new tab)"
        style={{ visibility: "hidden" }}
        className="fixed top-0 left-0 z-10 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
      />

      <p
        ref={signatureHintRef}
        aria-hidden
        className="pointer-events-none fixed bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-ink/40 uppercase"
      >
        Scroll
      </p>

      <HubLabel anchor={hovered?.slug === selectedSlug ? null : hovered} />
      <ProjectCard anchor={selected} onClose={() => setSelected(null)} />

      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap uppercase transition-opacity duration-700 ${interactive ? "opacity-100" : "opacity-0"}`}
      >
        <span className={`text-ink/45 transition-opacity duration-700 ${explored ? "opacity-0" : ""}`}>
          Each warm neuron is a project
        </span>
        <span className="text-ink/30">Scroll to dive in</span>
      </div>

      {/* Keyboard / screen-reader route to the same cards the neurons open. */}
      <nav
        aria-label="Projects"
        className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-14 focus-within:left-6 focus-within:z-30"
      >
        <ul className="flex flex-col items-start gap-1.5">
          {projects.map((project) => (
            <li key={project.slug}>
              <button
                type="button"
                onClick={() => openFromList(project.slug)}
                className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-xs text-ink backdrop-blur focus-visible:outline-2 focus-visible:outline-ember"
              >
                {project.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
