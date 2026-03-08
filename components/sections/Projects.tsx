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

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 769px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(
          `.${styles.panel}`
        );

        // Pin all panels except the last
        panels.forEach((panel, i) => {
          if (i < panels.length - 1) {
            ScrollTrigger.create({
              trigger: panel,
              start: "top top",
              pin: true,
              pinSpacing: false,
            });
          }
        });

        // Scale down + fade the current panel as the next one arrives
        panels.forEach((panel, i) => {
          if (i < panels.length - 1) {
            const inner = panel.querySelector(
              `.${styles.panelInner}`
            ) as HTMLElement;
            if (inner) {
              gsap.to(inner, {
                scale: 0.95,
                opacity: 0.4,
                scrollTrigger: {
                  trigger: panels[i + 1],
                  start: "top bottom",
                  end: "top top",
                  scrub: true,
                },
              });
            }
          }
        });

        // Content reveal on each panel
        panels.forEach((panel) => {
          const items = panel.querySelectorAll(`.${styles.animItem}`);
          gsap.fromTo(
            items,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 60%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      });

      // Mobile: simple reveal
      mm.add("(max-width: 768px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>(
          `.${styles.panel}`
        );
        panels.forEach((panel) => {
          const items = panel.querySelectorAll(`.${styles.animItem}`);
          gsap.fromTo(
            items,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "power3.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [repos]);

  return (
    <section ref={sectionRef} className={styles.projects} id="projects">
      <div className={styles.header}>
        <div className={styles.sectionLabel}>{"// Featured Work"}</div>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <p className={styles.sectionDesc}>
          A selection of production-grade projects spanning AI, web, desktop,
          and mobile.
        </p>
      </div>

      {repos.map((repo, i) => (
        <div key={repo.id} className={styles.panel}>
          <div className={styles.panelInner}>
            <div
              className={styles.panelBlob}
              style={{
                background:
                  GRADIENTS[repo.name] ||
                  "linear-gradient(135deg, #667eea, #764ba2)",
              }}
            />
            <div className={styles.panelContent}>
              <span
                className={`${styles.panelNumber} ${styles.animItem}`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                className={`${styles.panelName} ${styles.animItem}`}
              >
                {repo.name}
              </h3>
              <p
                className={`${styles.panelDesc} ${styles.animItem}`}
              >
                {repo.description || "A project by Fırat Tuna Arslan."}
              </p>
              <div
                className={`${styles.panelMeta} ${styles.animItem}`}
              >
                {repo.language && (
                  <span className={styles.panelLang}>
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
                <span className={styles.panelStat}>
                  ★ {repo.stargazers_count}
                </span>
                {repo.topics &&
                  repo.topics.slice(0, 4).map((t) => (
                    <span key={t} className={styles.panelTag}>
                      {t}
                    </span>
                  ))}
              </div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.panelLink} ${styles.animItem}`}
              >
                View Project
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </a>
            </div>
            <div className={styles.panelCounter}>
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(repos.length).padStart(2, "0")}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
