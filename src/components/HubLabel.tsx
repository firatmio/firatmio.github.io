import { projects } from "@/content/projects";
import type { HubAnchor } from "@/webgl/Experience";

/** Hover caption naming the project behind a neuron. */
export default function HubLabel({ anchor }: { anchor: HubAnchor | null }) {
  const project = anchor && projects.find((p) => p.slug === anchor.slug);
  if (!anchor || !project) return null;

  const offset = anchor.radius + 14;
  // Near the right edge the caption hangs to the left of the neuron instead.
  const flip = anchor.x > window.innerWidth - 240;

  return (
    <div
      key={anchor.slug}
      aria-hidden
      className="hub-label pointer-events-none fixed z-10 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-ink/85 uppercase"
      style={{
        top: anchor.y,
        ...(flip ? { right: window.innerWidth - anchor.x + offset } : { left: anchor.x + offset }),
      }}
    >
      {project.title} <span className="text-ink/40">{project.year}</span>
    </div>
  );
}
