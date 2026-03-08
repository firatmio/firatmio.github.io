"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./Preloader.module.css";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const counter = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(preloaderRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
          onComplete,
        });
      },
    });

    tl.to(counter, {
      value: 100,
      duration: 2,
      ease: "power2.inOut",
      snap: { value: 1 },
      onUpdate: () => {
        setCount(Math.round(counter.value));
      },
    });

    tl.to(
      fillRef.current,
      {
        width: "100%",
        duration: 2,
        ease: "power2.inOut",
      },
      0
    );

    tl.to(counterRef.current, {
      scale: 0.8,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={preloaderRef} className={styles.preloader}>
      <div className={styles.label}>Loading</div>
      <div ref={counterRef} className={styles.counter}>
        {count}
      </div>
      <div className={styles.progressBar}>
        <div ref={fillRef} className={styles.progressFill} />
      </div>
    </div>
  );
}
