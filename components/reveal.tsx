"use client";

import * as motion from "framer-motion/client";
import { useInView } from "framer-motion";
import { useRef } from "react";

type Props = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function Reveal({ children, delay = 0, y = 32, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      {children}
    </motion.div>
  );
}

// Clip-path text reveal — text slides up from beneath a hidden mask
export function TextReveal({ children, delay = 0, className, style }: Omit<Props, "y">) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} style={{ overflow: "hidden", display: "inline-block", ...style }} className={className}>
      <motion.div
        initial={{ y: "110%" }}
        animate={inView ? { y: "0%" } : { y: "110%" }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Stagger a list of children
export function StaggerReveal({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
    >
      {children}
    </motion.div>
  );
}

// Typed as Variants so usage in motion.div variants={staggerItem} passes tsc
import type { Variants } from "framer-motion";
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
