"use client";

import { useRef, useEffect } from "react";

type Props = { src: string; poster: string };

export function HeroVideo({ src, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    // If autoplay is blocked the video stays paused and the poster shows — nothing to do.
    v.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 40%", pointerEvents: "none" }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
