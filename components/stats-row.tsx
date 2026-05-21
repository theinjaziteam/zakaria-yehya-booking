"use client";

import { useState, useEffect } from "react";
import { span as MotionSpan } from "framer-motion/client";
import { AnimatePresence } from "framer-motion";

const WORD_SETS = [
  ["CRAFT",    "RITUAL",   "LEGACY"],
  ["SHARP",    "PRECISE",  "BOLD"],
  ["ICONIC",   "TIMELESS", "VERDUN"],
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function AnimatedWord({ word, colIndex }: { word: string; colIndex: number }) {
  return (
    <AnimatePresence mode="wait">
      <MotionSpan
        key={word}
        style={{ display: "inline-flex", overflow: "hidden" }}
        aria-label={word}
      >
        {word.split("").map((char, i) => (
          <MotionSpan
            key={`${word}-${i}`}
            style={{ display: "inline-block" }}
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-115%", opacity: 0 }}
            transition={{
              duration: 0.52,
              delay: colIndex * 0.08 + i * 0.038,
              ease,
            }}
          >
            {char === " " ? " " : char}
          </MotionSpan>
        ))}
      </MotionSpan>
    </AnimatePresence>
  );
}

export function StatsRow() {
  const [setIdx, setSetIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSetIdx(i => (i + 1) % WORD_SETS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const words = WORD_SETS[setIdx]!;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--hairline)",
        background: "#F9F6F1",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
      }}
    >
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            padding: "1.75rem 1.5rem",
            borderRight: i < words.length - 1 ? "1px solid var(--hairline)" : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.25rem, 3.5vw, 2.25rem)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1C1714",
              lineHeight: 1,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            <AnimatedWord word={word} colIndex={i} />
          </p>
        </div>
      ))}
    </div>
  );
}
