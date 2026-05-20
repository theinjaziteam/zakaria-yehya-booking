"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function Counter({ to, suffix = "", duration = 1800 }: { to: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}
