"use client";

import { useEffect, useState } from "react";
import styles from "./VisitorCounter.module.css";
import { IoEye } from "react-icons/io5";

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
      <IoEye />
      <span className={styles.count}>{count.toLocaleString("tr-TR")}</span>
      <span className={styles.label}>visitor</span>
    </div>
  );
}
