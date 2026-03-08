"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Skills.module.css";
import {
  SiPython, SiJavascript, SiTypescript, SiReact, SiNextdotjs,
  SiNodedotjs, SiGo, SiRust, SiFastapi, SiDjango,
  SiElectron, SiTauri, SiPostgresql, SiMongodb, SiFirebase, SiGit,
} from "react-icons/si";
import { TbBrandReactNative } from "react-icons/tb";

gsap.registerPlugin(ScrollTrigger);

// 4 marquee rows — each row is a group of skills
const ROWS = [
  [
    { name: "React", icon: <SiReact />, focus: true },
    { name: "Next.js", icon: <SiNextdotjs /> },
    { name: "TypeScript", icon: <SiTypescript />, focus: true },
    { name: "JavaScript", icon: <SiJavascript /> },
  ],
  [
    { name: "Python", icon: <SiPython /> },
    { name: "Node.js", icon: <SiNodedotjs />, focus: true },
    { name: "Go", icon: <SiGo /> },
    { name: "Rust", icon: <SiRust />, focus: true },
  ],
  [
    { name: "FastAPI", icon: <SiFastapi />, focus: true },
    { name: "Django", icon: <SiDjango /> },
    { name: "Electron", icon: <SiElectron /> },
    { name: "Tauri", icon: <SiTauri />, focus: true },
    { name: "React Native", icon: <TbBrandReactNative /> },
  ],
  [
    { name: "PostgreSQL", icon: <SiPostgresql />, focus: true },
    { name: "MongoDB", icon: <SiMongodb /> },
    { name: "Firebase", icon: <SiFirebase />, focus: true },
    { name: "Git", icon: <SiGit /> },
  ],
];

function MarqueeTrack({ items, index }: { items: typeof ROWS[0]; index: number }) {
  // Repeat items enough times for seamless loop
  const repeated = [...items, ...items, ...items, ...items, ...items, ...items];

  return (
    <div className={styles.marquee}>
      <div className={styles.track} data-index={index}>
        <div className={styles.trackInner}>
          {repeated.map((item, i) => (
            <span key={`${item.name}-${i}`} className={`${styles.word} ${item.focus ? styles.wordFocus : ""}`}>
              <span className={styles.wordIcon}>{item.icon}</span>
              {item.name}.
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const foldTopRef = useRef<HTMLDivElement>(null);
  const foldBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Marquee scroll — alternating directions
      const tracks = wrapperRef.current?.querySelectorAll(`.${styles.track}`);
      tracks?.forEach((track) => {
        const inner = track.querySelector(`.${styles.trackInner}`) as HTMLElement;
        if (!inner) return;
        const idx = Number(track.getAttribute("data-index") || 0);
        const [x, xEnd] = idx % 2 === 0 ? ["10%", "-40%"] : ["-30%", "5%"];

        gsap.fromTo(inner, { x }, {
          x: xEnd,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      });

      // 3D fold animation — panels fold open as you scroll in
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          end: "top 20%",
          scrub: 1,
        },
      });

      tl.fromTo(
        foldTopRef.current,
        { rotateX: -90 },
        { rotateX: 0, ease: "power2.out" },
        0
      );
      tl.fromTo(
        foldBottomRef.current,
        { rotateX: 90 },
        { rotateX: 0, ease: "power2.out" },
        0
      );
      tl.fromTo(
        wrapperRef.current,
        { opacity: 0.4 },
        { opacity: 1, ease: "none" },
        0
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.skills} id="skills">
      <div className={styles.skillsHeader}>
        <div className={styles.sectionLabel}>{"// Tech Stack"}</div>
        <h2 className={styles.sectionTitle}>Skills &amp; Technologies</h2>
      </div>

      <div className={styles.foldWrapper}>
        <div ref={foldTopRef} className={`${styles.fold} ${styles.foldTop}`}>
          <div className={styles.foldShade} />
        </div>

        <div ref={wrapperRef} className={styles.marqueeWrapper}>
          {ROWS.map((row, i) => (
            <MarqueeTrack key={i} items={row} index={i} />
          ))}
        </div>

        <div ref={foldBottomRef} className={`${styles.fold} ${styles.foldBottom}`}>
          <div className={styles.foldShade} />
        </div>
      </div>
    </section>
  );
}
