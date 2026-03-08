"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Projects.module.css";
import type { GitHubRepo } from "@/lib/github";

gsap.registerPlugin(ScrollTrigger);

const GRADIENTS: Record<string, string> = {
  "cardioguard-mg": "linear-gradient(135deg, #e74c3c, #c0392b)",
  "filmbox-promo": "linear-gradient(135deg, #ffa94d, #ff6b6b)",
  "omni-sketch": "linear-gradient(135deg, #66d9e8, #51cf66)",
  codessa: "linear-gradient(135deg, #2ecc71, #27ae60)",
  "lynq-desktop": "linear-gradient(135deg, #e67e22, #d35400)",
  "lofi-pomodoro": "linear-gradient(135deg, #1abc9c, #16a085)",
  "db-viewer": "linear-gradient(135deg, #34495e, #2c3e50)",
  "reveal-animation": "linear-gradient(135deg, #ff6b6b, #51cf66)",
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3776ab",
  Go: "#00add8",
  Dart: "#0175c2",
  HTML: "#e34f26",
  CSS: "#563d7c",
  Rust: "#dea584",
};

interface ProjectsProps {
  repos: GitHubRepo[];
}

export default function Projects({ repos }: ProjectsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        if (!scrollRef.current || !pinRef.current) return;

        const totalWidth = scrollRef.current.scrollWidth;
        const viewWidth = pinRef.current.offsetWidth;

        // Cards reveal first
        const cards = scrollRef.current.querySelectorAll(`.${styles.card}`);
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 70%",
          once: true,
          onEnter: () => {
            gsap.to(cards, {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
            });
          },
        });

        // Horizontal pin scroll
        if (totalWidth > viewWidth) {
          gsap.to(scrollRef.current, {
            x: -(totalWidth - viewWidth + 60),
            ease: "none",
            scrollTrigger: {
              trigger: pinRef.current,
              pin: true,
              start: "top 15%",
              end: `+=${totalWidth}`,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        }
      });

      // Mobile: simple reveal
      mm.add("(max-width: 768px)", () => {
        const cards = scrollRef.current?.querySelectorAll(`.${styles.card}`);
        if (cards) {
          ScrollTrigger.batch(cards, {
            onEnter: (batch) => {
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power3.out",
              });
            },
            start: "top 85%",
          });
        }
      });

      // 3D tilt on hover
      const cards = scrollRef.current?.querySelectorAll(`.${styles.card}`);
      cards?.forEach((card) => {
        const el = card as HTMLElement;
        el.addEventListener("mousemove", (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(el, {
            rotateY: x * 10,
            rotateX: -y * 10,
            transformPerspective: 800,
            duration: 0.4,
            ease: "power2.out",
          });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.5)",
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [repos]);

  return (
    <section ref={sectionRef} className={styles.projects} id="projects">
      <div className={styles.projectsInner}>
        <div className={styles.sectionLabel}>{"// Featured Work"}</div>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <p className={styles.sectionDesc}>
          A selection of production-grade projects spanning AI, web, desktop, and mobile.
        </p>

        <div ref={pinRef} className={styles.pinWrapper}>
          <div ref={scrollRef} className={styles.horizontalScroll}>
            {repos.map((repo) => (
              <div key={repo.id} className={styles.card}>
                <div className={styles.cardVisual}>
                  <div
                    className={styles.cardGradient}
                    style={{
                      background:
                        GRADIENTS[repo.name] ||
                        "linear-gradient(135deg, #667eea, #764ba2)",
                    }}
                  />
                  <span className={styles.cardProjectName}>{repo.name}</span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{repo.name}</h3>
                  <p className={styles.cardDesc}>
                    {repo.description || "A project by Fırat Tuna Arslan."}
                  </p>

                  {repo.topics && repo.topics.length > 0 && (
                    <div className={styles.cardTags}>
                      {repo.topics.slice(0, 4).map((t) => (
                        <span key={t} className={styles.tag}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    <div className={styles.cardStats}>
                      {repo.language && (
                        <span className={styles.cardLanguage}>
                          <span
                            className={styles.langDot}
                            style={{
                              background:
                                LANG_COLORS[repo.language] || "#666",
                            }}
                          />
                          {repo.language}
                        </span>
                      )}
                      <span className={styles.cardStat}>
                        ★ {repo.stargazers_count}
                      </span>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.cardLink}
                    >
                      View
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
