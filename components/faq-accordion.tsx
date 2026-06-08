"use client";

import { useState } from "react";

type FaqItem = { question: string; answer: string };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)", flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-0">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <article
            key={item.question}
            className={i < items.length - 1 ? "border-b border-border" : ""}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-md py-md text-left transition-opacity hover:opacity-70"
            >
              <h3
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "var(--title-md-size)",
                  letterSpacing: "var(--title-md-tracking)",
                }}
              >
                {item.question}
              </h3>
              <span className="text-fg">
                <ChevronIcon open={open} />
              </span>
            </button>
            <div
              style={{
                display: "grid",
                gridTemplateRows: open ? "1fr" : "0fr",
                transition: "grid-template-rows 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <p
                  className="text-body pb-md"
                  style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8, maxWidth: "60ch" }}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
      <div className="border-t border-border" />
    </div>
  );
}
