import type { CSSProperties, Ref } from "react";
import { contacts } from "@/content/contact";

/**
 * The journey's closing moment, and the site's footer: the night sky's stars gather into
 * the contact logos, and each logo is a real link. The anchors are laid over the logos
 * every frame by the scene, and `--reveal` (0..1) fades them in as the logos finish forming.
 */
export default function ContactStars({
  ref,
  onHover,
}: {
  ref: Ref<HTMLElement>;
  /** The logo under the pointer or keyboard focus (contacts order), so the scene can brighten it. */
  onHover(index: number | null): void;
}) {
  return (
    <section
      ref={ref}
      aria-labelledby="contact-title"
      className="contact-stars pointer-events-none fixed inset-0 z-10"
      style={{ "--reveal": 0, visibility: "hidden" } as CSSProperties}
    >
      <h2 id="contact-title" className="sr-only">
        Contact
      </h2>

      <ul>
        {contacts.map((contact, i) => {
          const external = !contact.href.startsWith("mailto:");
          return (
            <li key={contact.id}>
              {/* The whole logo is the link's hit area; its name and handle hang below it. */}
              <a
                data-contact
                href={contact.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={`${contact.label} — ${contact.handle}`}
                onPointerEnter={() => onHover(i)}
                onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(i)}
                onBlur={() => onHover(null)}
                className="group pointer-events-auto absolute top-0 left-0 block rounded-2xl outline-none focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-ember/70"
              >
              </a>
            </li>
          );
        })}
      </ul>

      {/* The dunes are bright at the bottom of the frame; darken them behind the caption. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 px-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-balance text-ink/85 uppercase md:text-[13px]">
          The stars gathered into ways to reach me
        </p>
        <p className="font-mono text-[11px] tracking-[0.18em] text-ink/55 uppercase">© 2026 Fırat Tuna Arslan</p>
      </div>
    </section>
  );
}
