"use client";

import { useState, useEffect, useRef } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  // Set iOS-specific attributes that React doesn't output lowercase
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
  }, [idx]); // re-run on each remount (key change)

  // key={idx} forces a full remount → autoPlay fires reliably on every video
  return (
    <video
      key={idx}
      ref={ref}
      src={videos[idx]}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={() => setIdx(i => (i + 1) % videos.length)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 40%", pointerEvents: "none" }}
    />
  );
}
