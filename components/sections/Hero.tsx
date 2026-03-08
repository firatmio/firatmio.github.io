"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Hero.module.css";
import MagneticButton from "../MagneticButton";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  avatarUrl: string;
}

export default function Hero({ avatarUrl }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
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
        const nameText = nameRef.current.innerHTML;
        const chars = nameRef.current.querySelectorAll("span[data-char]");
        if (chars.length === 0) {
          // Split name into chars
          const words = nameRef.current.childNodes;
          const allSpans: HTMLElement[] = [];
          words.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || "";
              const fragment = document.createDocumentFragment();
              text.split("").forEach((char) => {
                if (char === " ") {
                  fragment.appendChild(document.createTextNode(" "));
                } else {
                  const span = document.createElement("span");
                  span.setAttribute("data-char", "");
                  span.style.display = "inline-block";
                  span.style.opacity = "0";
                  span.style.transform = "translateY(60px)";
                  span.textContent = char;
                  fragment.appendChild(span);
                  allSpans.push(span);
                }
              });
              node.replaceWith(fragment);
            } else if (node instanceof HTMLElement) {
              const text = node.textContent || "";
              node.innerHTML = "";
              const innerSpans: HTMLElement[] = [];
              text.split("").forEach((char) => {
                if (char === " ") {
                  node.appendChild(document.createTextNode(" "));
                } else {
                  const span = document.createElement("span");
                  span.setAttribute("data-char", "");
                  span.style.display = "inline-block";
                  span.style.opacity = "0";
                  span.style.transform = "translateY(60px)";
                  span.textContent = char;
                  node.appendChild(span);
                  innerSpans.push(span);
                }
              });
              allSpans.push(...innerSpans);
            }
          });

          tl.to(
            allSpans,
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

          <h1 ref={nameRef} className={styles.name}>
            Fırat Tuna{" "}
            <span className={styles.nameAccent}>Arslan</span>
          </h1>

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
