"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Hero.module.css";
import MagneticButton from "../MagneticButton";
import KineticName from "../KineticName";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  avatarUrl: string;
}

export default function Hero({ avatarUrl }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.2 });

      // Greeting fade in
      tl.to(greetingRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      // Name reveal - character by character
      if (nameRef.current) {
        const chars = nameRef.current.querySelectorAll("[data-char]");
        gsap.set(chars, { visibility: "visible", opacity: 0, y: 60 });
        tl.to(
          chars,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.03,
            ease: "power4.out",
          },
          "-=0.2"
        );
      }

      // Hand-drawn arrow draw-in
      if (arrowRef.current) {
        const path = arrowRef.current.querySelector("path") as SVGPathElement;
        const head1 = arrowRef.current.querySelector(".arrow-head-1") as SVGPathElement;
        const head2 = arrowRef.current.querySelector(".arrow-head-2") as SVGPathElement;
        if (path) {
          const len = path.getTotalLength();
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.set([head1, head2], { strokeDasharray: 20, strokeDashoffset: 20 });
          gsap.set(arrowRef.current, { opacity: 1 });
          tl.to(path, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "-=0.1");
          tl.to([head1, head2], { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "-=0.2");
        }
      }

      // Title slide up
      tl.to(
        titleRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.3"
      );

      // Status fade in
      tl.to(
        statusRef.current,
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.4"
      );

      // Avatar clip-path reveal
      tl.to(
        avatarRef.current,
        {
          clipPath: "circle(50% at 50% 50%)",
          duration: 1.2,
          ease: "power3.inOut",
        },
        "-=0.8"
      );

      // Avatar glow
      tl.to(
        glowRef.current,
        {
          opacity: 1,
          duration: 1,
          ease: "power2.out",
        },
        "-=0.6"
      );

      // CTAs stagger
      tl.to(
        ctasRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
        },
        "-=0.6"
      );

      // Scroll indicator
      tl.to(
        scrollRef.current,
        {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.2"
      );

      // Floating shapes parallax
      if (shapesRef.current) {
        const shapes = shapesRef.current.children;
        Array.from(shapes).forEach((shape, i) => {
          gsap.to(shape, {
            y: -80 * (i + 1),
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        });
      }

      // Mouse parallax
      const handleMouse = (e: MouseEvent) => {
        if (!shapesRef.current) return;
        const { clientX, clientY } = e;
        const xRatio = (clientX / window.innerWidth - 0.5) * 2;
        const yRatio = (clientY / window.innerHeight - 0.5) * 2;

        gsap.to(shapesRef.current.children, {
          x: (i) => xRatio * (15 + i * 10),
          y: (i) => yRatio * (15 + i * 10),
          duration: 1,
          ease: "power2.out",
        });
      };

      window.addEventListener("mousemove", handleMouse);
      return () => window.removeEventListener("mousemove", handleMouse);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Initial states via gsap.set equivalents through CSS opacity: 0
  return (
    <section ref={sectionRef} className={styles.hero} id="hero">
      <div className={styles.gridBg} />

      <div ref={shapesRef} className={styles.floatingShapes}>
        <div className={`${styles.shape} ${styles.shape1}`} />
        <div className={`${styles.shape} ${styles.shape2}`} />
        <div className={`${styles.shape} ${styles.shape3}`} />
      </div>

      <div className={styles.heroInner}>
        <div className={styles.content}>
          <div ref={greetingRef} className={styles.greeting}>
            {"// Hello World"}
          </div>

          <div className={styles.nameWrapper}>
            <KineticName
              ref={nameRef}
              firstName="Fırat Tuna"
              lastName="Arslan"
            />
            <svg
              ref={arrowRef}
              className={styles.handArrow}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M82 3 C78 6, 70 10, 62 18 C54 26, 56 32, 48 36 C40 40, 32 35, 28 42 C24 49, 28 56, 22 64 C16 72, 10 78, 14 88"
                stroke="var(--accent)"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                className="arrow-head-1"
                d="M6 80 L14 88"
                stroke="var(--accent)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                className="arrow-head-2"
                d="M22 82 L14 88"
                stroke="var(--accent)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p ref={titleRef} className={styles.title} style={{ transform: "translateY(30px)" }}>
            Software &amp; Full-Stack Web Developer
          </p>

          <div ref={statusRef} className={styles.status}>
            <span className={styles.statusDot} />
            💭 feeling like runtime error
          </div>

          <div ref={ctasRef} className={styles.ctas} style={{ transform: "translateY(20px)" }}>
            <MagneticButton
              as="a"
              href="#projects"
              className={styles.ctaPrimary}
            >
              View Projects
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </MagneticButton>
            <MagneticButton
              as="a"
              href="#contact"
              className={styles.ctaSecondary}
            >
              Get in Touch
            </MagneticButton>
          </div>
        </div>

        <div className={styles.avatarSide}>
          <div ref={glowRef} className={styles.avatarGlow} />
          <div ref={avatarRef} className={styles.avatarWrapper}>
            <img
              src={avatarUrl}
              alt="Fırat Tuna Arslan"
              width={400}
              height={400}
            />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className={styles.scrollIndicator}>
        <span className={styles.scrollText}>Scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  );
}
