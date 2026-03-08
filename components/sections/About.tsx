"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./About.module.css";
import CounterAnimation from "../CounterAnimation";
import SplitTextReveal from "../SplitTextReveal";
import { FaRobot, FaPuzzlePiece, FaDesktop, FaChartLine, FaTools, FaRocket } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

const FOCUS_AREAS = [
  {
    icon: <FaRobot />,
    title: "AI-Powered Applications",
    desc: "LLMs, NLP, data pipelines — building intelligent systems that learn and adapt.",
  },
  {
    icon: <FaPuzzlePiece />,
    title: "Real-time Systems",
    desc: "Collaborative platforms and live data processing with low-latency architectures.",
  },
  {
    icon: <FaDesktop />,
    title: "Desktop & Web Hybrids",
    desc: "Electron, Tauri — bridging the gap between web and native desktop experiences.",
  },
  {
    icon: <FaChartLine />,
    title: "Observability-Driven Dev",
    desc: "Monitoring, logging, metrics — measurable systems over assumptions.",
  },
  {
    icon: <FaTools />,
    title: "Developer Tooling",
    desc: "UX-first system design and tools that developers actually want to use.",
  },
  {
    icon: <FaRocket />,
    title: "Production Systems",
    desc: "Scalable architectures that are reliable, maintainable, and battle-tested.",
  },
];

const PRINCIPLES = [
  "Production-first mindset",
  "System reliability & performance",
  "Metrics > assumptions",
  "Clean architecture",
  "Testable code",
  "Long-term maintainability",
];

interface AboutProps {
  repoCount: number;
  contributions: number;
}

export default function About({ repoCount, contributions }: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const principlesTitleRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section label
      ScrollTrigger.create({
        trigger: labelRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(labelRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
          });
        },
      });

      // Stats stagger
      if (statsRef.current) {
        const statEls = statsRef.current.querySelectorAll(`.${styles.stat}`);
        ScrollTrigger.create({
          trigger: statsRef.current,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(statEls, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
              ease: "power3.out",
            });
          },
        });
      }

      // Focus cards stagger
      if (cardsRef.current) {
        const cards = cardsRef.current.querySelectorAll(`.${styles.focusCard}`);
        ScrollTrigger.create({
          trigger: cardsRef.current,
          start: "top 80%",
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
      }

      // Principles
      ScrollTrigger.create({
        trigger: principlesTitleRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(principlesTitleRef.current, {
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
          });
        },
      });

      if (tagsRef.current) {
        const tags = tagsRef.current.children;
        ScrollTrigger.create({
          trigger: tagsRef.current,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.to(tags, {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power3.out",
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.about} id="about">
      <div className={styles.aboutInner}>
        <div ref={labelRef} className={styles.sectionLabel}>
          {"// About Me"}
        </div>

        <SplitTextReveal
          as="h2"
          className={styles.sectionTitle}
          splitBy="words"
          stagger={0.08}
        >
          Building systems that scale, survive, and stay observable
        </SplitTextReveal>

        <div className={styles.bioText}>
          <SplitTextReveal
            as="span"
            splitBy="words"
            stagger={0.02}
            duration={0.6}
          >
            AI Engineering student with 8+ years of hands-on software development experience, building production-grade systems across web, desktop, and AI platforms. I design scalable architectures, care about system observability, and ship products that are reliable, maintainable, and measurable in real-world usage.
          </SplitTextReveal>
        </div>

        <div ref={statsRef} className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>
              <CounterAnimation end={8} suffix="+" duration={2} />
            </div>
            <div className={styles.statLabel}>Years Experience</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>
              <CounterAnimation end={repoCount} duration={2} />
            </div>
            <div className={styles.statLabel}>Repositories</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>
              <CounterAnimation end={contributions} duration={2.5} />
            </div>
            <div className={styles.statLabel}>Contributions</div>
          </div>
        </div>

        <div ref={cardsRef} className={styles.focusGrid}>
          {FOCUS_AREAS.map((area) => (
            <div key={area.title} className={styles.focusCard}>
              <div className={styles.focusIcon}>{area.icon}</div>
              <div className={styles.focusTitle}>{area.title}</div>
              <div className={styles.focusDesc}>{area.desc}</div>
            </div>
          ))}
        </div>

        <div className={styles.principles}>
          <div ref={principlesTitleRef} className={styles.principlesTitle}>
            Engineering Principles
          </div>
          <div ref={tagsRef} className={styles.principlesList}>
            {PRINCIPLES.map((p) => (
              <span key={p} className={styles.principleTag}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
