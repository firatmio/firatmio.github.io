import { MARK } from "./LogoMark";

/**
 * Shown while a scene loads: the site's mark, its soma breathing and a signal running the
 * fibre home over and over. Fades out once the scene's first frame is drawn.
 */
export default function LoadingMark({ done }: { done: boolean }) {
  return (
    <div
      role="status"
      className={`pointer-events-none fixed inset-0 z-10 grid place-items-center transition-opacity duration-700 ${done ? "opacity-0" : "opacity-100"}`}
    >
      <span className="sr-only">{done ? "" : "Loading"}</span>
      <svg aria-hidden viewBox="0 0 64 64" className="w-14 overflow-visible text-ink">
        <g transform={MARK.offset}>
          <g fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className="opacity-35">
            {MARK.dendrites.map((d) => (
              <path key={d} d={d} />
            ))}
            <path d={MARK.loop} />
          </g>
          <path d={MARK.soma} fill="currentColor" className="opacity-85 motion-safe:animate-pulse" />
          <circle r={3} className="fill-ember [filter:drop-shadow(0_0_3px_rgb(255_178_122/0.9))] motion-reduce:hidden">
            <animateMotion
              dur="2.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keyPoints="0;1"
              keyTimes="0;1"
              keySplines="0.45 0 0.55 1"
              path={MARK.loop}
            />
          </circle>
          {/* Asked for less motion: the signal rests where the fibre turns. */}
          <circle cx={MARK.signal.x} cy={MARK.signal.y} r={3} className="hidden fill-ember motion-reduce:block" />
        </g>
      </svg>
    </div>
  );
}
