import type { CSSProperties, ReactNode, Ref } from "react";
import { about } from "@/content/about";

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs tracking-[0.22em] text-ink/60 uppercase">{children}</p>;
}

function Statement({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 text-[clamp(2.25rem,5vw,4.25rem)] leading-none font-semibold tracking-tight text-ink">
      {children}
    </h3>
  );
}

function Detail({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/85 md:text-xl">{children}</p>;
}

/** One beat of the About stop; `--beat-N` (-1 → 0 → 1) on the section drives it. */
function Beat({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-end md:items-center">
      {/* The fade and drift sit on the text itself, so its layer is only as big as the text. */}
      <div className="about-beat max-w-2xl" style={{ "--v": `var(--beat-${index}, -1)` } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

/**
 * The About stop, shown while the camera rests inside the neuron and told in beats.
 * Visibility comes straight from scroll progress via custom properties, so the text is
 * always in the document for screen readers and search engines.
 */
export default function AboutOverlay({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section
      ref={ref}
      aria-labelledby="about-title"
      className="pointer-events-none fixed inset-0 z-10"
      style={{ "--reveal": 0 } as CSSProperties}
    >
      <div
        aria-hidden
        className="about-scrim absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent md:bg-linear-to-r md:from-black/70 md:via-black/25"
      />

      <div className="absolute inset-x-6 top-24 bottom-20 [text-shadow:0_1px_24px_rgb(0_0_0/0.9)] md:inset-x-[8vw] md:inset-y-0">
        <Beat index={0}>
          <Eyebrow>About</Eyebrow>
          <h2
            id="about-title"
            className="mt-5 text-[clamp(3rem,8vw,7rem)] leading-[0.92] font-semibold tracking-tight text-ink"
          >
            {about.name}
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-snug font-medium text-ink/85 md:text-2xl">{about.role}</p>
        </Beat>

        <Beat index={1}>
          <Eyebrow>{about.background.eyebrow}</Eyebrow>
          <Statement>{about.background.statement}</Statement>
          <Detail>{about.background.detail}</Detail>
          <dl className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            {about.background.facts.map((fact) => (
              <div key={fact.label} className="border-t border-white/15 pt-3">
                <dt className="font-mono text-xs tracking-[0.18em] text-ink/55 uppercase">{fact.label}</dt>
                <dd className="mt-1.5 text-base font-medium text-ink md:text-lg">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Beat>

        <Beat index={2}>
          <Eyebrow>{about.focus.eyebrow}</Eyebrow>
          <Statement>{about.focus.statement}</Statement>
          <Detail>{about.focus.detail}</Detail>
        </Beat>

        <Beat index={3}>
          <Eyebrow>{about.stack.eyebrow}</Eyebrow>
          <Statement>{about.stack.statement}</Statement>
          <div className="mt-7 space-y-4">
            {about.stack.groups.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-xs tracking-[0.18em] text-ink/55 uppercase">{group.label}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      // The blur behind each pill is redone every frame over the moving scene — too
                      // costly on a phone, where the dark scrim behind them does the job alone.
                      className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-ink md:text-base md:backdrop-blur-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Beat>
      </div>
    </section>
  );
}
