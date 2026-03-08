"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Navbar.module.css";

gsap.registerPlugin(ScrollTrigger);

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Timeline", href: "#timeline" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    // Scroll detection for nav background
    ScrollTrigger.create({
      start: "top -80",
      end: 99999,
      onUpdate: (self) => {
        setScrolled(self.progress > 0);
      },
    });

    // Active section tracking
    NAV_ITEMS.forEach(({ href }) => {
      const id = href.replace("#", "");
      const section = document.getElementById(id);
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => setActiveSection(id),
        onEnterBack: () => setActiveSection(id),
      });
    });

    // Logo entrance animation
    if (navRef.current) {
      gsap.from(navRef.current, {
        yPercent: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 2.5,
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  const toggleMobile = () => {
    const opening = !mobileOpen;
    setMobileOpen(opening);

    if (opening && mobileMenuRef.current) {
      gsap.from(mobileLinkRefs.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.1,
      });
    }
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}
      >
        <div className={styles.navInner}>
          <a
            href="#"
            className={styles.logo}
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            firattunaarslan<span className={styles.logoAccent}>.</span>me
          </a>

          <div className={styles.links}>
            {NAV_ITEMS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className={`${styles.link} ${
                  activeSection === href.replace("#", "")
                    ? styles.linkActive
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(href);
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <button
            className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
            onClick={toggleMobile}
            aria-label="Toggle menu"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </nav>

      <div
        ref={mobileMenuRef}
        className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ""}`}
      >
        {NAV_ITEMS.map(({ label, href }, i) => (
          <a
            key={href}
            ref={(el) => {
              mobileLinkRefs.current[i] = el;
            }}
            href={href}
            className={styles.mobileLink}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick(href);
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </>
  );
}
