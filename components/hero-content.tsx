"use client";

import * as motion from "framer-motion/client";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const line = {
  hidden: { y: "105%" },
  show: (d: number) => ({ y: "0%", transition: { duration: 0.7, delay: d, ease } }),
};

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
};

export function HeroContent({ eyebrow, title, body, ctaLabel }: Props) {
  return (
    <motion.div
      className="mx-auto w-full max-w-7xl"
      initial="hidden"
      animate="show"
    >
      {/* Eyebrow */}
      <div style={{ overflow: "hidden", marginBottom: "1rem" }}>
        <motion.p
          custom={0.15}
          variants={line}
          className="font-mono uppercase"
          style={{ fontSize: "0.8125rem", letterSpacing: "0.18em", opacity: 0.65 }}
        >
          {eyebrow}
        </motion.p>
      </div>

      {/* Title — each word on its own clip rail */}
      <h1
        style={{
          fontSize: "clamp(2.5rem, 7.5vw, 6.5rem)",
          lineHeight: 0.95,
          letterSpacing: "0.03em",
          maxWidth: "14ch",
          marginBottom: "1.5rem",
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
        }}
      >
        {title.split("\n").map((ln, i) => (
          <span key={i} style={{ display: "block", overflow: "hidden" }}>
            <motion.span custom={0.3 + i * 0.12} variants={line} style={{ display: "block" }}>
              {ln}
            </motion.span>
          </span>
        ))}
      </h1>

      {/* Body */}
      <div style={{ overflow: "hidden", marginBottom: "2rem" }}>
        <motion.p
          custom={0.55}
          variants={line}
          style={{
            fontSize: "clamp(0.9375rem, 1.5vw, 1.125rem)",
            lineHeight: 1.78,
            maxWidth: "44ch",
            color: "rgba(249,246,241,0.90)",
          }}
        >
          {body}
        </motion.p>
      </div>

      {/* CTAs */}
      <div style={{ overflow: "hidden" }}>
        <motion.div custom={0.7} variants={line} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.25rem" }}>
          <a
            href="/book"
            className="inline-flex h-14 items-center justify-center px-10 font-mono uppercase tracking-widest transition-opacity hover:opacity-85"
            style={{
              borderRadius: "var(--radius-pill)",
              background: "#F9F6F1",
              color: "#1C1714",
              fontSize: "1rem",
              letterSpacing: "0.15em",
              textDecoration: "none",
            }}
          >
            {ctaLabel}
          </a>
          <a
            href="#services"
            className="font-mono uppercase transition-opacity hover:opacity-100"
            style={{ fontSize: "0.8125rem", letterSpacing: "0.14em", color: "rgba(249,246,241,0.65)" }}
          >
            View services ↓
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
