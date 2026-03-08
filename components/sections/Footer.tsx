"use client";

import styles from "./Footer.module.css";
import { FaGithub, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { FiArrowUp } from "react-icons/fi";

const SOCIALS = [
  { label: "GitHub", icon: <FaGithub />, href: "https://github.com/firatmio" },
  { label: "LinkedIn", icon: <FaLinkedinIn />, href: "https://linkedin.com/in/firattunaarslan" },
  { label: "Instagram", icon: <FaInstagram />, href: "https://instagram.com/firattunaarslann" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.copyright}>
          © {new Date().getFullYear()}{" "}
          <span className={styles.copyrightName}>Fırat Tuna Arslan</span>
        </div>

        <div className={styles.socials}>
          {SOCIALS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              {s.icon}
              <span>{s.label}</span>
            </a>
          ))}
        </div>

        <button className={styles.scrollTop} onClick={scrollToTop}>
          <FiArrowUp style={{ marginRight: 6 }} /> Back to top
        </button>
      </div>
    </footer>
  );
}
