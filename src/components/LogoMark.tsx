/**
 * The site's mark: a neuron whose longest fibre curls back home, a signal glowing where it
 * turns — neuron, star and the journey's endless loop in one. (`src/app/icon.svg` draws the
 * same shapes, bolder, for the browser tab.)
 */
export const MARK = {
  soma: "M24 32.2c3.9-.1 6.6 2.8 6.3 6.3-.3 3.4-3 5.8-6.4 5.6-3.5-.2-5.8-2.9-5.6-6.2.2-3.3 2.5-5.6 5.7-5.7z",
  dendrites: ["M20.2 33.6Q13.8 28.4 10 19.5", "M19.8 41.8Q12.8 45.2 9 52"],
  loop: "M30.2 35C40 25.6 55 28.6 54.6 41.6 54.2 53.6 40.6 58.2 32.6 50.6",
  signal: { x: 54.6, y: 41.6 },
  /** Centres the drawing in its 64 × 64 box. */
  offset: "translate(0 -6.5)",
};

export default function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform={MARK.offset}>
        <g fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
          {MARK.dendrites.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={MARK.loop} />
        </g>
        <path d={MARK.soma} fill="currentColor" />
        <circle cx={MARK.signal.x} cy={MARK.signal.y} r={3.4} className="fill-ember" />
      </g>
    </svg>
  );
}
