import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { projects } from "@/content/projects";

// Only the projects in the network exist; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: `${project.title} — Fırat Tuna Arslan`, description: project.summary };
}

/**
 * A project's own page, linked from its card in the neuron network: a plain, quiet read
 * rather than another cinematic scene.
 */
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const project = projects[index];
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <div className="relative min-h-svh overflow-hidden">
      {/* A faint warm and cool glow — the network's colours, far off. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_15%_0%,rgb(255_178_122/0.1),transparent_70%),radial-gradient(45%_40%_at_95%_15%,rgb(77_148_255/0.08),transparent_70%)]"
      />

      <header className="relative mx-auto max-w-3xl px-6 pt-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-ink/60 uppercase transition-colors hover:text-ink"
        >
          <LuArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
          Fırat Tuna Arslan
        </Link>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 pt-24 pb-20 md:pt-32">
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">
          {project.year}
          {project.featured && <span className="ml-2 text-ember">· Current focus</span>}
        </p>
        <h1 className="mt-4 font-(family-name:--font-fraunces) text-5xl font-light tracking-tight text-ink md:text-7xl">
          {project.title}
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-pretty text-ink/80 md:text-xl">{project.summary}</p>

        <section aria-labelledby="stack-title" className="mt-14">
          <h2 id="stack-title" className="font-mono text-[11px] tracking-[0.18em] text-ink/50 uppercase">
            Stack
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-ink/75"
              >
                {tag}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <nav
        aria-label="More projects"
        className="relative mx-auto grid max-w-3xl grid-cols-2 gap-6 border-t border-white/10 px-6 py-10"
      >
        <Link href={`/projects/${previous.slug}`} className="group flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-ink/45 uppercase">
            <LuArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
            Previous
          </span>
          <span className="text-ink/80 transition-colors group-hover:text-ink">{previous.title}</span>
        </Link>
        <Link href={`/projects/${next.slug}`} className="group flex flex-col items-end gap-1.5 text-right">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-ink/45 uppercase">
            Next
            <LuArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </span>
          <span className="text-ink/80 transition-colors group-hover:text-ink">{next.title}</span>
        </Link>
      </nav>
    </div>
  );
}
