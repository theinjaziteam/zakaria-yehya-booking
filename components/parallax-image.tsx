"use client";

import * as motion from "framer-motion/client";

type Props = {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
};

export function ParallaxImage({ src, alt, style, className }: Props) {
  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      style={style}
      initial={{ scale: 1.08 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    />
  );
}
