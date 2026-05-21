"use client";

import { Counter } from "@/components/counter";
import { StaggerReveal, staggerItem } from "@/components/reveal";
import * as motion from "framer-motion/client";

const stats = [
  { value: 8,    suffix: "",    label: "Stylists" },
  { value: 1998, suffix: "",    label: "Est." },
  { value: 5000, suffix: "+",   label: "Clients served" },
];

export function StatsRow() {
  return (
    <StaggerReveal
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        borderBottom: "1px solid var(--hairline)",
        background: "#F9F6F1",
      }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          variants={staggerItem}
          style={{
            padding: "2rem 1.5rem",
            borderRight: i < stats.length - 1 ? "1px solid var(--hairline)" : undefined,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "0.02em",
              color: "#1C1714",
              lineHeight: 1,
              marginBottom: "0.4rem",
            }}
          >
            <Counter to={s.value} suffix={s.suffix} />
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(28,23,20,0.45)",
            }}
          >
            {s.label}
          </p>
        </motion.div>
      ))}
    </StaggerReveal>
  );
}
