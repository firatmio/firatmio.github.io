"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/content/projects";
import { QUACOMES_LOGO } from "@/content/quacomes-logo";
import type { Experience, HubAnchor } from "@/webgl/Experience";
import { SIGNATURE_WEIGHT, signatureFontFamily } from "@/webgl/fonts";
import { smoothstep } from "@/webgl/math";
import { aboutBeats, aboutReveal, contactReveal } from "@/webgl/stages";
import AboutOverlay from "./AboutOverlay";
import ContactStars from "./ContactStars";
import HubLabel from "./HubLabel";
import ProjectCard from "./ProjectCard";

export default function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
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
  const selectedSlug = selected?.slug ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    // Load three.js lazily so the HTML shell paints before the WebGL bundle arrives.
    import("@/webgl/Experience").then(async ({ Experience }) => {
      // The signature is rasterised from its typeface — wait until that has really loaded.
      await document.fonts.load(`${SIGNATURE_WEIGHT} 64px ${signatureFontFamily()}`).catch(() => undefined);
      if (disposed) return;
      try {
        const experience = new Experience(canvas, {
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
        });
        experience.setProgress(progressRef.current);
        experienceRef.current = experience;
      } catch (error) {
        // TODO(phase 12): static fallback for devices without WebGL.
        console.warn("WebGL experience failed to start", error);
      }
    });

    return () => {
      disposed = true;
      experienceRef.current?.dispose();
      experienceRef.current = null;
    };
  }, []);

  // Scroll is the timeline: ScrollTrigger scrubs a single 0..1 progress value, with a
  // little lag so the camera eases after the wheel instead of jerking with it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    gsap.registerPlugin(ScrollTrigger);
    const journey = { progress: 0 };
    const ctx = gsap.context(() => {
      gsap.to(journey, {
        progress: 1,
        ease: "none",
        scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 1.2 },
        onUpdate: () => {
          progressRef.current = journey.progress;
          experienceRef.current?.setProgress(journey.progress);
          // Written straight to the DOM — no React render per scroll frame.
          const signatureHint = signatureHintRef.current;
          if (signatureHint) signatureHint.style.opacity = String(1 - smoothstep(0, 0.02, journey.progress));
          const contactSection = contactRef.current;
          if (contactSection) {
            const reveal = contactReveal(journey.progress);
            contactSection.style.setProperty("--reveal", reveal.toFixed(3));
            // Hidden entirely while faded out, so its links drop out of the tab order.
            contactSection.style.visibility = reveal < 0.02 ? "hidden" : "visible";
          }
          const aboutSection = aboutRef.current;
          if (aboutSection) {
            aboutSection.style.setProperty("--reveal", aboutReveal(journey.progress).toFixed(3));
            aboutBeats(journey.progress).forEach((beat, i) =>
              aboutSection.style.setProperty(`--beat-${i}`, beat.toFixed(3)),
            );
          }
        },
      });
    });
    return () => ctx.revert();
  }, []);

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

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="fixed inset-0 block h-full w-full" />

      {/* The scroll track: its height is the length of the journey. */}
      <div ref={trackRef} aria-hidden className="pointer-events-none relative h-[1300svh]" />

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
