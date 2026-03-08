"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // Check if device has fine pointer
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });
    const fxTo = gsap.quickTo(follower, "x", { duration: 0.5, ease: "power3.out" });
    const fyTo = gsap.quickTo(follower, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      xTo(e.clientX);
      yTo(e.clientY);
      fxTo(e.clientX);
      fyTo(e.clientY);
    };

    const onEnterInteractive = () => {
      gsap.to(cursor, { scale: 2.5, duration: 0.3, ease: "power2.out" });
      gsap.to(follower, { scale: 0, duration: 0.3, ease: "power2.out" });
    };

    const onLeaveInteractive = () => {
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(follower, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    window.addEventListener("mousemove", onMove);

    const interactiveElements = document.querySelectorAll(
      "a, button, [data-cursor-hover]"
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    // MutationObserver for dynamically added elements
    const observer = new MutationObserver(() => {
      const newElements = document.querySelectorAll(
        "a, button, [data-cursor-hover]"
      );
      newElements.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor} />
      <div ref={followerRef} className={styles.cursorFollower} />
    </>
  );
}
