"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BouncyDivider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current || !containerRef.current) return;

    const proxy = { y: 60 };

    const updatePath = () => {
      if (!pathRef.current) return;
      pathRef.current.setAttribute(
        "d",
        `M 0 100 Q 720 ${100 - proxy.y * 2} 1440 100 L 1440 100 L 0 100 Z`
      );
    };

    // Set initial curved state
    updatePath();

    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        y: 0,
        duration: 2.5,
        ease: "elastic.out(1, 0.3)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        onUpdate: updatePath,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        lineHeight: 0,
        overflow: "hidden",
        marginTop: "-1px",
      }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "80px",
          display: "block",
        }}
      >
        <defs>
          <linearGradient
            id="bouncyGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          d="M 0 100 Q 720 -20 1440 100 L 1440 100 L 0 100 Z"
          fill="url(#bouncyGradient)"
          opacity="0.15"
        />
      </svg>
    </div>
  );
}
