"use client";

import * as motion from "framer-motion/client";
import { StaggerReveal, staggerItem } from "@/components/reveal";

type Step = { title: string; body: string };

export function HowItWorksSteps({ steps }: { steps: Step[] }) {
  return (
    <StaggerReveal className="grid gap-0">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          variants={staggerItem}
          className="grid grid-cols-[3rem_1fr] gap-md border-t border-border py-md sm:grid-cols-[4rem_1fr_1fr] sm:items-start"
        >
          <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg pt-xxs">
            {String(i + 1).padStart(2, "0")}
          </p>
          <h3
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
          >
            {step.title}
          </h3>
          <p
            className="col-start-2 text-body sm:col-start-3"
            style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}
          >
            {step.body}
          </p>
        </motion.div>
      ))}
      <div className="border-t border-border" />
    </StaggerReveal>
  );
}
