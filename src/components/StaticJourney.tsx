import Link from "next/link";
import type { ReactNode } from "react";
import { about } from "@/content/about";
import { contacts } from "@/content/contact";
import { projects } from "@/content/projects";

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-mono text-[11px] tracking-[0.2em] text-ink/50 uppercase">
      {children}
    </h2>
  );
}

/**
 * Everything the journey holds, as a plain page — for browsers that can't run it (no
 * WebGL 2, or the GPU gave out partway).
 */
export default function StaticJourney() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* A faint warm and cool glow — the network's colours, far off. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_15%_0%,rgb(255_178_122/0.1),transparent_70%),radial-gradient(45%_40%_at_95%_15%,rgb(77_148_255/0.08),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-16 md:pt-28">
        <header>
          <h1 className="font-(family-name:--font-fraunces) text-5xl font-light tracking-tight text-ink md:text-7xl">
            {about.name}
          </h1>
          <p className="mt-5 text-lg text-ink/80 md:text-xl">{about.role}</p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-ink/45 uppercase">
            This browser can&apos;t run the 3D journey — here is everything it holds.
          </p>
        </header>

        <section aria-labelledby="static-about" className="mt-20">
          <SectionTitle id="static-about">About</SectionTitle>
          <p className="mt-5 text-2xl font-medium tracking-tight text-ink">{about.background.statement}</p>
          <p className="mt-3 leading-relaxed text-ink/75">{about.background.detail}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {about.background.facts.map((fact) => (
              <div key={fact.label} className="border-t border-white/15 pt-3">
                <dt className="font-mono text-xs tracking-[0.18em] text-ink/55 uppercase">{fact.label}</dt>
                <dd className="mt-1.5 font-medium text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-12 text-2xl font-medium tracking-tight text-ink">{about.focus.statement}</p>
          <p className="mt-3 leading-relaxed text-ink/75">{about.focus.detail}</p>
          <div className="mt-8 space-y-4">
            {about.stack.groups.map((group) => (
              <div key={group.label}>
                <p className="font-mono text-xs tracking-[0.18em] text-ink/55 uppercase">{group.label}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-ink/75"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="static-projects" className="mt-20">
          <SectionTitle id="static-projects">Projects</SectionTitle>
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {projects.map((project) => (
              <li key={project.slug}>
                <Link href={`/projects/${project.slug}`} className="group block py-5">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-lg font-medium text-ink/90 transition-colors group-hover:text-ink">
                      {project.title}
                    </span>
                    <span className="font-mono text-xs text-ink/45">{project.year}</span>
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-ink/65">{project.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="static-contact" className="mt-20">
          <SectionTitle id="static-contact">Contact</SectionTitle>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {contacts.map((contact) => {
              const external = !contact.href.startsWith("mailto:");
              return (
                <li key={contact.id}>
                  <a
                    href={contact.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="group flex flex-col gap-1 rounded-xl border border-white/10 bg-white/3 px-4 py-3 transition-colors hover:border-white/25"
                  >
                    <span className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">{contact.label}</span>
                    <span className="text-ink/80 transition-colors group-hover:text-ink">{contact.handle}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <footer className="mt-20 font-mono text-[11px] tracking-[0.18em] text-ink/40 uppercase">© 2026 {about.name}</footer>
      </div>
    </div>
  );
}
