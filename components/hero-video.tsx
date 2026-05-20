"use client";

import { useRef, useEffect } from "react";

type Props = { src: string; poster: string };

export function HeroVideo({ src, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    // If autoplay is blocked (mobile data-saver etc.), hide the video element
    // so the poster shows cleanly with no native play-button overlay.
    v.play().catch(() => {
      if (ref.current) ref.current.style.display = "none";
    });
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      // pointer-events:none removes the clickable native play overlay on Android
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 30%", pointerEvents: "none" }}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
