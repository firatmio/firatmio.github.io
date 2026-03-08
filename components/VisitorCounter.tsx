"use client";

import { useEffect, useState } from "react";
import styles from "./VisitorCounter.module.css";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visitors", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.count > 0) setCount(data.count);
      })
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <div className={styles.counter}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className={styles.count}>{count.toLocaleString("tr-TR")}</span>
      <span className={styles.label}>ziyaretçi</span>
    </div>
  );
}
