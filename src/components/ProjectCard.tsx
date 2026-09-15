import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { projects } from "@/content/projects";
import type { HubAnchor } from "@/webgl/Experience";

const CARD_WIDTH = 360;
const GAP = 28;
const EDGE = 24;
/** Must match the exit transition in globals.css. */
const EXIT_MS = 340;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Liquid-glass summary card that blooms out beside the selected project neuron. */
export default function ProjectCard({
  anchor,
  onClose,
}: {
  anchor: HubAnchor | null;
  onClose: () => void;
}) {
  // Keep the last project mounted while the exit transition plays.
  const [shown, setShown] = useState(anchor);
  if (anchor && anchor !== shown) setShown(anchor);
  const open = anchor !== null;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setShown(null), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Land keyboard and screen-reader users on the card as it opens.
  const slug = anchor?.slug;
  useEffect(() => {
    if (slug) dialogRef.current?.focus({ preventScroll: true });
  }, [slug]);

  const project = shown && projects.find((p) => p.slug === shown.slug);
  if (!shown || !project) return null;

  const onRight = shown.x < window.innerWidth / 2;
  const left = clamp(
    onRight ? shown.x + shown.radius + GAP : shown.x - shown.radius - GAP - CARD_WIDTH,
    EDGE,
    window.innerWidth - CARD_WIDTH - EDGE,
  );
  const top = clamp(shown.y, 220, window.innerHeight - 220);

  return (
    <div
      key={project.slug}
      ref={dialogRef}
      role="dialog"
      aria-labelledby="project-card-title"
      tabIndex={-1}
      data-state={open ? "open" : "closed"}
      className="glass project-card fixed z-20 outline-none max-md:inset-x-4 max-md:bottom-4 max-md:max-h-[70dvh] max-md:overflow-y-auto md:top-(--card-top) md:left-(--card-left) md:w-[360px] md:-translate-y-1/2"
      style={
        {
          "--card-left": `${left}px`,
          "--card-top": `${top}px`,
          "--card-origin": onRight ? "left center" : "right center",
        } as CSSProperties
      }
    >
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">
              {project.year}
              {project.featured && <span className="ml-2 text-ember">· Current focus</span>}
            </p>
            <h2 id="project-card-title" className="mt-2 text-2xl font-medium tracking-tight text-ink">
              {project.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-white/10 hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink/75">{project.summary}</p>

        <ul aria-label="Stack" className="mt-5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-ink/70"
            >
              {tag}
            </li>
          ))}
        </ul>

        <Link
          href={`/projects/${project.slug}`}
          className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink"
        >
          View project
          <span aria-hidden className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
