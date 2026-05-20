"use client";

import { useRef, useState } from "react";
import * as motion from "framer-motion/client";

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  href?: string;
  strength?: number;
};

export function MagneticButton({ children, className, style, onClick, href, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    setPos({ x, y });
  }
  function onLeave() { setPos({ x: 0, y: 0 }); }

  const Tag = href ? motion.a : motion.div;

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: "inline-block" }}>
      <Tag
        href={href as string}
        onClick={onClick}
        className={className}
        style={style}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.5 }}
      >
        {children}
      </Tag>
    </div>
  );
}
