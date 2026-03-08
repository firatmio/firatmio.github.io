"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Timeline.module.css";

gsap.registerPlugin(ScrollTrigger);

const MILESTONES = [
  {
    year: "2018",
    title: "Started Coding Journey",
    desc: "Began exploring programming with Python and web technologies. Built first small projects and scripts.",
    techs: ["Python", "HTML", "CSS"],
  },
  {
    year: "2019",
    title: "Frontend Deep Dive",
    desc: "Mastered JavaScript and CSS, started building interactive web experiences and UI components.",
    techs: ["JavaScript", "CSS", "React"],
  },
  {
    year: "2020",
    title: "Full-Stack Transition",
    desc: "Expanded into backend development with Node.js, Django, and database systems. Built end-to-end applications.",
    techs: ["Node.js", "Django", "PostgreSQL"],
  },
  {
    year: "2021",
    title: "TypeScript & Modern Stack",
    desc: "Adopted TypeScript as primary language. Dove into Next.js, modern React patterns, and type-safe architectures.",
    techs: ["TypeScript", "Next.js", "React"],
  },
  {
    year: "2022",
    title: "Desktop & Mobile",
    desc: "Expanded to cross-platform development with Electron and React Native. Shipped desktop and mobile apps.",
    techs: ["Electron", "React Native", "Tauri"],
  },
  {
    year: "2023",
    title: "Systems & Performance",
    desc: "Focus shifted to Rust, Go, and systems-level thinking. Built authentication systems and real-time platforms.",
    techs: ["Go", "Rust", "FastAPI"],
  },
  {
    year: "2024",
    title: "AI Engineering",
    desc: "Started AI Engineering studies. Built CardioGuard — an end-to-end health tech platform with CNN + AI pipeline.",
    techs: ["AI/ML", "Python", "TensorFlow"],
  },
  {
    year: "2025 — Present",
    title: "Production-Grade Systems",
    desc: "57+ repositories, 2,299+ contributions. Shipping scalable, observable, production-ready systems across web, desktop, and AI.",
    techs: ["Full-Stack", "AI", "Open Source"],
  },
];

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineFillRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Line fill animation
      if (lineFillRef.current) {
        gsap.to(lineFillRef.current, {
          height: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: itemsRef.current,
            start: "top 70%",
            end: "bottom 70%",
            scrub: 1,
          },
        });
      }

      // Items reveal
      if (itemsRef.current) {
        const items = itemsRef.current.querySelectorAll(`.${styles.item}`);
        items.forEach((item, i) => {
          const dot = item.querySelector(`.${styles.dot}`);
          const pulseEl = item.querySelector(`.${styles.dotPulse}`);

          ScrollTrigger.create({
            trigger: item,
            start: "top 80%",
            once: true,
            onEnter: () => {
              gsap.to(item, {
                opacity: 1,
                x: 0,
                duration: 0.8,
                ease: "power3.out",
                delay: i * 0.05,
              });

              if (dot) {
                gsap.to(dot, {
                  borderColor: "var(--accent)",
                  boxShadow: "0 0 20px rgba(255, 107, 107, 0.3)",
                  duration: 0.4,
                  delay: 0.3 + i * 0.05,
                });
              }

              if (pulseEl) {
                gsap.to(pulseEl, {
                  opacity: 0.4,
                  scale: 2,
                  duration: 0.6,
                  delay: 0.3 + i * 0.05,
                  onComplete: () => {
                    gsap.to(pulseEl, {
                      opacity: 0,
                      scale: 1,
                      duration: 0.4,
                    });
                  },
                });
              }
            },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.timeline} id="timeline">
      <div className={styles.timelineInner}>
        <div className={styles.sectionLabel}>{"// Journey"}</div>
        <h2 className={styles.sectionTitle}>Timeline</h2>

        <div className={styles.track}>
          <div className={styles.line} />
          <div ref={lineFillRef} className={styles.lineFill} />

          <div ref={itemsRef} className={styles.items}>
            {MILESTONES.map((m) => (
              <div key={m.year} className={styles.item}>
                <div className={styles.dot} />
                <div className={styles.dotPulse} />
                <div className={styles.year}>{m.year}</div>
                <div className={styles.itemTitle}>{m.title}</div>
                <div className={styles.itemDesc}>{m.desc}</div>
                <div className={styles.itemTechs}>
                  {m.techs.map((t) => (
                    <span key={t} className={styles.tech}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
