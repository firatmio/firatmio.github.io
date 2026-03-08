"use client";

import {
  Fragment,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import gsap from "gsap";
import styles from "./KineticName.module.css";

const NUM_TYPE_LINES = 24;

interface KineticNameProps {
  firstName: string;
  lastName: string;
}

const KineticName = forwardRef<HTMLHeadingElement, KineticNameProps>(
  ({ firstName, lastName }, ref) => {
    const containerRef = useRef<HTMLHeadingElement>(null);
    const kineticRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const hoverTlRef = useRef<gsap.core.Timeline | null>(null);
    const kineticTlRef = useRef<gsap.core.Timeline | null>(null);
    const backdropTweenRef = useRef<gsap.core.Tween | null>(null);
    const isActiveRef = useRef(false);

    useImperativeHandle(ref, () => containerRef.current!);

    const getChars = useCallback((): HTMLElement[] => {
      if (!containerRef.current) return [];
      return Array.from(containerRef.current.querySelectorAll("[data-char]"));
    }, []);

    const getInners = useCallback((): HTMLElement[] => {
      if (!containerRef.current) return [];
      return Array.from(
        containerRef.current.querySelectorAll(`.${styles.charInner}`)
      );
    }, []);

    // Calculate and store character widths
    useEffect(() => {
      const calculateWidths = () => {
        const chars = getChars();
        chars.forEach((char, i) => {
          const inner = char.querySelector(
            `.${styles.charInner}`
          ) as HTMLElement;
          if (inner) {
            const width = inner.getBoundingClientRect().width;
            const padding = 4;
            const totalWidth = Math.max(width + padding, 20);
            char.dataset.charWidth = String(totalWidth);
            char.style.maxWidth = `${totalWidth}px`;
          }
          char.style.setProperty("--char-index", String(i));
        });
      };

      document.fonts.ready.then(calculateWidths);

      let resizeTimer: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(calculateWidths, 250);
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimer);
      };
    }, [getChars]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        hoverTlRef.current?.kill();
        kineticTlRef.current?.kill();
        backdropTweenRef.current?.kill();
      };
    }, []);

    const startKineticAnimation = useCallback(() => {
      const kineticEl = kineticRef.current;
      if (!kineticEl) return;

      const typeLines =
        kineticEl.querySelectorAll<HTMLElement>(`.${styles.typeLine}`);
      const oddLines =
        kineticEl.querySelectorAll<HTMLElement>(`.${styles.typeLineOdd}`);
      const evenLines =
        kineticEl.querySelectorAll<HTMLElement>(`.${styles.typeLineEven}`);

      gsap.set(kineticEl, { scale: 1, rotation: 0, opacity: 1, visibility: "visible" });
      gsap.set(typeLines, { opacity: 0.00, x: "0%" });

      // Fade in backdrop blur
      if (backdropTweenRef.current) backdropTweenRef.current.kill();
      const backdrop = backdropRef.current;
      if (backdrop) {
        gsap.set(backdrop, { visibility: "visible" });
        backdropTweenRef.current = gsap.to(backdrop, {
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          duration: 0.6,
          ease: "power2.out",
        });
      }

      const tl = gsap.timeline();

      tl.to(kineticEl, {
        duration: 1.4,
        ease: "expo.inOut",
        scale: 1.8,
        rotation: -90,
      });

      tl.to(
        oddLines,
        {
          keyframes: [
            { x: "20%", duration: 1, ease: "expo.inOut" },
            { x: "-200%", duration: 1.5, ease: "expo.inOut" },
          ],
          stagger: 0.08,
        },
        0
      );

      tl.to(
        evenLines,
        {
          keyframes: [
            { x: "-20%", duration: 1, ease: "expo.inOut" },
            { x: "200%", duration: 1.5, ease: "expo.inOut" },
          ],
          stagger: 0.08,
        },
        0
      );

      tl.to(
        typeLines,
        {
          keyframes: [
            { opacity: 1, duration: 1, ease: "expo.inOut" },
            { opacity: 0, duration: 1.5, ease: "expo.inOut" },
          ],
          stagger: 0.05,
        },
        0
      );

      kineticTlRef.current = tl;
    }, []);

    const fadeOutKineticAnimation = useCallback(() => {
      if (kineticTlRef.current) {
        kineticTlRef.current.kill();
        kineticTlRef.current = null;
      }

      const kineticEl = kineticRef.current;
      if (!kineticEl) return;

      const typeLines =
        kineticEl.querySelectorAll<HTMLElement>(`.${styles.typeLine}`);

      // Fade out backdrop blur
      if (backdropTweenRef.current) backdropTweenRef.current.kill();
      const backdrop = backdropRef.current;
      if (backdrop) {
        backdropTweenRef.current = gsap.to(backdrop, {
          backdropFilter: "blur(0px)",
          WebkitBackdropFilter: "blur(0px)",
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            gsap.set(backdrop, { visibility: "hidden" });
          },
        });
      }

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(kineticEl, { scale: 1, rotation: 0, visibility: "hidden" });
          gsap.set(typeLines, { opacity: 0, x: "0%" });
        },
      });

      tl.to(kineticEl, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: "expo.inOut",
      });

      kineticTlRef.current = tl;
    }, []);

    const handleMouseEnter = useCallback(() => {
      if (isActiveRef.current) return;
      isActiveRef.current = true;

      const chars = getChars();
      const inners = getInners();

      if (hoverTlRef.current) hoverTlRef.current.kill();
      if (kineticTlRef.current) kineticTlRef.current.kill();

      containerRef.current?.classList.add(styles.active);

      const tl = gsap.timeline();

      tl.to(
        chars,
        {
          maxWidth: (_i: number, target: HTMLElement) => {
            const baseWidth = parseFloat(
              target.dataset.charWidth || "60"
            );
            return baseWidth * 1.35;
          },
          duration: 0.64,
          stagger: 0.04,
          ease: "expo.inOut",
        },
        0
      );

      tl.to(
        inners,
        {
          x: -10,
          duration: 0.64,
          stagger: 0.04,
          ease: "expo.inOut",
        },
        0.05
      );

      hoverTlRef.current = tl;
      startKineticAnimation();
    }, [getChars, getInners, startKineticAnimation]);

    const handleMouseLeave = useCallback(() => {
      if (!isActiveRef.current) return;
      isActiveRef.current = false;

      const chars = getChars();
      const inners = getInners();

      if (hoverTlRef.current) hoverTlRef.current.kill();
      containerRef.current?.classList.remove(styles.active);

      const tl = gsap.timeline();

      tl.to(
        inners,
        {
          x: 0,
          duration: 0.64,
          stagger: 0.03,
          ease: "expo.inOut",
        },
        0
      );

      tl.to(
        chars,
        {
          maxWidth: (_i: number, target: HTMLElement) =>
            parseFloat(target.dataset.charWidth || "60"),
          duration: 0.64,
          stagger: 0.03,
          ease: "expo.inOut",
        },
        0.05
      );

      hoverTlRef.current = tl;
      fadeOutKineticAnimation();
    }, [getChars, getInners, fadeOutKineticAnimation]);

    const renderWord = (word: string) =>
      word.split("").map((char, i) => (
        <span key={`${word}-${i}`} className={styles.char} data-char="">
          <span className={styles.charInner}>{char}</span>
        </span>
      ));

    const fullName = `${firstName} ${lastName}`;
    const repeatedText = `${fullName} · `.repeat(3);
    const firstNameWords = firstName.split(" ");

    return (
      <>
        <h1
          ref={containerRef}
          className={styles.container}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {firstNameWords.map((word, wi) => (
            <Fragment key={wi}>
              {wi > 0 && <span className={styles.space}>&nbsp;</span>}
              <span className={styles.word}>{renderWord(word)}</span>
            </Fragment>
          ))}
          <span className={styles.space}>&nbsp;</span>
          <span className={`${styles.word} ${styles.accentWord}`}>
            {renderWord(lastName)}
          </span>
        </h1>

        <div ref={backdropRef} className={styles.kineticBackdrop} aria-hidden="true" />
        <div
          ref={kineticRef}
          className={styles.kineticType}
          aria-hidden="true"
        >
          {Array.from({ length: NUM_TYPE_LINES }, (_, i) => (
            <div
              key={i}
              className={`${styles.typeLine} ${
                i % 2 === 0 ? styles.typeLineOdd : styles.typeLineEven
              }`}
            >
              {repeatedText}
            </div>
          ))}
        </div>
      </>
    );
  }
);

KineticName.displayName = "KineticName";
export default KineticName;
