"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LineRevealProps {
  children: string;
  as?: "p" | "span" | "h2" | "h3";
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
}

export default function LineReveal({
  children,
  as: Tag = "p",
  className = "",
  delay = 0,
  duration = 1,
  stagger = 0.15,
}: LineRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lines = children.split("\n").filter(Boolean);
    container.innerHTML = "";

    const lineElements: HTMLElement[] = [];
    lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.style.overflow = "hidden";
      wrapper.style.lineHeight = "inherit";
      const inner = document.createElement("div");
      inner.textContent = line;
      inner.style.lineHeight = "inherit";
      wrapper.appendChild(inner);
      container.appendChild(wrapper);
      lineElements.push(inner);
    });

    gsap.set(lineElements, { yPercent: 100, opacity: 0 });

    ScrollTrigger.create({
      trigger: container,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(lineElements, {
          yPercent: 0,
          opacity: 1,
          duration,
          stagger,
          ease: "power3.out",
          delay,
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
    };
  }, [children, delay, duration, stagger]);

  return (
    <div ref={containerRef} className={className} aria-label={children}>
      {children}
    </div>
  );
}
