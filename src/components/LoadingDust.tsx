/** A few motes of dust, loosely clustered, each pulsing on its own beat. */
const MOTES = [
  { x: 6, y: 15, r: 2, beat: 1.9, delay: 0 },
  { x: 16, y: 6, r: 1.5, beat: 2.4, delay: 0.5 },
  { x: 22, y: 17, r: 2.6, beat: 1.6, delay: 0.9, warm: true },
  { x: 32, y: 9, r: 1.4, beat: 2.8, delay: 0.2 },
  { x: 13, y: 25, r: 1.2, beat: 2.2, delay: 1.3 },
];

/** Shown while a scene loads; fades out once its first frame is drawn. */
export default function LoadingDust({ done }: { done: boolean }) {
  return (
    <div
      role="status"
      className={`pointer-events-none fixed inset-0 z-10 grid place-items-center transition-opacity duration-700 ${done ? "opacity-0" : "opacity-100"}`}
    >
      <span className="sr-only">{done ? "" : "Loading"}</span>
      <svg
        aria-hidden
        viewBox="0 0 38 30"
        className="w-12 overflow-visible [filter:drop-shadow(0_0_4px_rgb(230_236_245/0.55))]"
      >
        {MOTES.map((mote, i) => (
          <circle
            key={i}
            cx={mote.x}
            cy={mote.y}
            r={mote.r}
            className={`${mote.warm ? "fill-ember" : "fill-ink/80"} motion-safe:animate-pulse`}
            style={{ animationDuration: `${mote.beat}s`, animationDelay: `${mote.delay}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
