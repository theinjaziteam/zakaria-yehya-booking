"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number; // ms stagger delay
  once?: boolean;
};

export function ScrollReveal({ children, className = "", delay = 0, once = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = delay ? `${delay}ms` : "";
          el.setAttribute("data-visible", "true");
          if (once) observer.disconnect();
        } else if (!once) {
          el.removeAttribute("data-visible");
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, once]);

  return (
    <div ref={ref} className={`reveal ${className}`} data-visible="false">
      {children}
    </div>
  );
}
