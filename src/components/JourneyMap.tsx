import type { Ref } from "react";
import { clamp01 } from "@/webgl/math";
import { JOURNEY_STOPS, LOOP } from "@/webgl/stages";

/** Where each stop's node sits in the map's 60 × 120 box — a loose, hand-grown branch. */
const NODES: [number, number][] = [
  [40, 10],
  [24, 29],
  [36, 50],
  [19, 69],
  [33, 89],
  [22, 110],
];
/** How far each fibre bows out of line — never straight. */
const BOWS = [-9, 8, -7, 9, -6];
const fibre = ([ax, ay]: [number, number], [bx, by]: [number, number], bow: number) =>
  `M${ax} ${ay}Q${(ax + bx) / 2 + bow} ${(ay + by) / 2} ${bx} ${by}`;
/** The fibre home: from the last node round the outside back to the first. */
const RETURN = `M${NODES[5][0]} ${NODES[5][1]}C64 96 64 24 ${NODES[0][0]} ${NODES[0][1]}`;

/**
 * A faint neuron branch in the corner: one node per landmark of the journey, a signal
 * travelling the fibres as you scroll, and the node you're at alight. It doesn't say what
 * it is — a click on a node carries you there, for whoever thinks to try.
 */
export default function JourneyMap({ ref }: { ref: Ref<HTMLElement> }) {
  const travel = (at: number) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: (at / LOOP.end) * (document.documentElement.scrollHeight - window.innerHeight),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <nav
      ref={ref}
      aria-label="Journey"
      className="fixed right-5 bottom-6 z-10 h-30 w-15 origin-bottom-right opacity-40 transition-opacity duration-700 focus-within:opacity-90 hover:opacity-90 max-md:right-3 max-md:bottom-4 max-md:scale-80"
    >
      <svg aria-hidden viewBox="0 0 60 120" className="absolute inset-0 size-full overflow-visible">
        {/* The long way back, from the last stop to the first: the journey loops. */}
        <path data-return d={RETURN} fill="none" stroke="currentColor" strokeWidth={0.5} className="text-ink/15" />
        {NODES.slice(1).map((node, i) => (
          <path
            key={i}
            data-fibre
            d={fibre(NODES[i], node, BOWS[i])}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.6}
            className="text-ink/30"
          />
        ))}
        {NODES.map(([x, y], i) => (
          <circle
            key={i}
            data-node
            cx={x}
            cy={y}
            r={2}
            className="fill-ink/70 transition-[fill,r] duration-500 data-active:fill-ember data-active:[r:3.2] motion-safe:animate-pulse"
            style={{ animationDuration: `${1.7 + ((i * 0.83) % 1.3)}s`, animationDelay: `${(i * 0.37) % 1}s` }}
          />
        ))}
        <circle data-signal cx={NODES[0][0]} cy={NODES[0][1]} r={1.3} className="fill-ember" />
      </svg>

      {JOURNEY_STOPS.map((stop, i) => (
        <button
          key={stop.name}
          type="button"
          data-stop
          aria-label={stop.name}
          onClick={() => travel(stop.at)}
          className="absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ember/70"
          style={{ left: `${(NODES[i][0] / 60) * 100}%`, top: `${(NODES[i][1] / 120) * 100}%` }}
        />
      ))}
    </nav>
  );
}

/** Move the map's signal along its fibres and light the stop the journey is at — straight to the DOM. */
export function updateJourneyMap(root: HTMLElement | null, progress: number): void {
  if (!root) return;
  let at = 0;
  while (at < JOURNEY_STOPS.length - 1 && progress >= JOURNEY_STOPS[at + 1].at - 0.004) at++;
  root.querySelectorAll("[data-node]").forEach((node, i) => node.toggleAttribute("data-active", i === at));
  root.querySelectorAll("[data-stop]").forEach((stop, i) => {
    if (i === at) stop.setAttribute("aria-current", "step");
    else stop.removeAttribute("aria-current");
  });

  const signal = root.querySelector("[data-signal]");
  if (!signal) return;
  // Past the last stop the signal takes the long fibre home, arriving as the loop does.
  const last = at === JOURNEY_STOPS.length - 1;
  const fibreAhead = last
    ? root.querySelector<SVGPathElement>("[data-return]")
    : root.querySelectorAll<SVGPathElement>("[data-fibre]")[at];
  if (!fibreAhead) return;
  const next = last ? LOOP.end : JOURNEY_STOPS[at + 1].at;
  const t = clamp01((progress - JOURNEY_STOPS[at].at) / (next - JOURNEY_STOPS[at].at));
  const point = fibreAhead.getPointAtLength(t * fibreAhead.getTotalLength());
  signal.setAttribute("cx", point.x.toFixed(2));
  signal.setAttribute("cy", point.y.toFixed(2));
}
