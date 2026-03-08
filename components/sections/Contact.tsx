"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Contact.module.css";
import SplitTextReveal from "../SplitTextReveal";
import MagneticButton from "../MagneticButton";
import { FiMail, FiGlobe } from "react-icons/fi";
import { FaLinkedinIn, FaInstagram, FaGithub } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

const CONTACT_LINKS = [
  { icon: <FiMail />, label: "firattunaarslan@gmail.com", href: "mailto:firattunaarslan@gmail.com" },
  { icon: <FiGlobe />, label: "firattunaarslan.me", href: "https://firattunaarslan.me" },
  { icon: <FaLinkedinIn />, label: "LinkedIn", href: "https://linkedin.com/in/firattunaarslan" },
  { icon: <FaInstagram />, label: "Instagram", href: "https://instagram.com/firattunaarslann" },
  { icon: <FaGithub />, label: "GitHub", href: "https://github.com/firatmio" },
];

const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#________";

function scrambleText(
  el: HTMLElement,
  finalText: string,
  duration: number = 600
) {
  let frame = 0;
  const totalFrames = Math.ceil(duration / 30);

  const interval = setInterval(() => {
    frame++;
    const progress = frame / totalFrames;
    const revealedLength = Math.floor(finalText.length * progress);

    let display = "";
    for (let i = 0; i < finalText.length; i++) {
      if (i < revealedLength) {
        display += finalText[i];
      } else {
        display += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
    }
    el.textContent = display;

    if (frame >= totalFrames) {
      clearInterval(interval);
      el.textContent = finalText;
    }
  }, 30);

  return () => clearInterval(interval);
}

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  const handleLinkHover = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const textEl = e.currentTarget.querySelector(`.${styles.linkText}`) as HTMLElement;
    if (textEl) {
      const originalText = textEl.getAttribute("data-text") || textEl.textContent || "";
      scrambleText(textEl, originalText, 500);
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Links stagger
      if (linksRef.current) {
        const links = linksRef.current.querySelectorAll(`.${styles.contactLink}`);
        ScrollTrigger.create({
          trigger: linksRef.current,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(links, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "power3.out",
            });
          },
        });
      }

      // Quote
      ScrollTrigger.create({
        trigger: quoteRef.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(quoteRef.current, {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.contact} id="contact">
      <div className={styles.contactInner}>
        <div className={styles.sectionLabel}>{"// Get in Touch"}</div>

        <SplitTextReveal
          as="h2"
          className={styles.bigTitle}
          splitBy="words"
          stagger={0.1}
          duration={0.9}
        >
          {"Let's Build Something "}
        </SplitTextReveal>
        <h2 className={styles.bigTitle}>
          <span className={styles.bigTitleAccent}>
            <SplitTextReveal
              splitBy="words"
              stagger={0.1}
              duration={0.9}
            >
              Together
            </SplitTextReveal>
          </span>
        </h2>

        <p className={styles.subtitle}>
          Looking for a developer who cares about performance, architecture, and shipping real products? Let&apos;s talk.
        </p>

        <div className={styles.ctaRow}>
          <MagneticButton
            as="a"
            href="mailto:firattunaarslan@gmail.com"
            className={styles.ctaPrimary}
          >
            <FiMail style={{ marginRight: 8 }} /> Send Email
          </MagneticButton>
        </div>

        <div ref={linksRef} className={styles.links}>
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
              onMouseEnter={handleLinkHover}
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              <span className={styles.linkText} data-text={link.label}>
                {link.label}
              </span>
            </a>
          ))}
        </div>

        <div ref={quoteRef} className={styles.quote}>
          <div className={styles.quoteText}>
            &ldquo;I build systems that scale, survive, and stay observable.&rdquo;
          </div>
          <div className={styles.quoteAuthor}>— Fırat Tuna Arslan</div>
        </div>
      </div>
    </section>
  );
}
