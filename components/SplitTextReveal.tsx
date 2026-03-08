"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  splitBy?: "chars" | "words";
  trigger?: "scroll" | "mount";
  scrub?: boolean;
}

export default function SplitTextReveal({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
  duration = 0.8,
  stagger = 0.03,
  splitBy = "chars",
  trigger = "scroll",
  scrub = false,
}: SplitTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || hasAnimated.current) return;

    const text = children;
    container.innerHTML = "";

    const units =
      splitBy === "chars" ? text.split("") : text.split(/(\s+)/);

    const spans: HTMLSpanElement[] = [];
    units.forEach((unit) => {
      if (unit === " " || /^\s+$/.test(unit)) {
        const space = document.createTextNode(" ");
        container.appendChild(space);
        return;
      }

      if (splitBy === "chars") {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.overflow = "hidden";
        const inner = document.createElement("span");
        inner.style.display = "inline-block";
        inner.textContent = unit;
        span.appendChild(inner);
        container.appendChild(span);
        spans.push(inner);
      } else {
        const wrapper = document.createElement("span");
        wrapper.style.display = "inline-block";
        wrapper.style.overflow = "hidden";
        const inner = document.createElement("span");
        inner.style.display = "inline-block";
        inner.textContent = unit;
        wrapper.appendChild(inner);
        container.appendChild(wrapper);

        const spaceNode = document.createTextNode(" ");
        container.appendChild(spaceNode);

        spans.push(inner);
      }
    });

    gsap.set(spans, { yPercent: 110, opacity: 0 });

    const animConfig: gsap.TweenVars = {
      yPercent: 0,
      opacity: 1,
      duration,
      stagger,
      ease: "power4.out",
      delay,
    };

    if (trigger === "scroll" && !scrub) {
      ScrollTrigger.create({
        trigger: container,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(spans, animConfig);
          hasAnimated.current = true;
        },
      });
    } else if (trigger === "scroll" && scrub) {
      gsap.to(spans, {
        yPercent: 0,
        opacity: 1,
        stagger,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
      });
    } else {
      gsap.to(spans, animConfig);
      hasAnimated.current = true;
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
    };
  }, [children, delay, duration, stagger, splitBy, trigger, scrub]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label={children}
      style={{ display: Tag === 'span' ? 'inline' : undefined }}
    >
      {children}
    </div>
  );
}
