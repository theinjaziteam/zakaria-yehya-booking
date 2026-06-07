"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    // Explicit play() call as belt-and-suspenders alongside the autoPlay attribute.
    // Needed in Chrome/Safari when the browser delays the attribute-triggered play.
    const v = refs.current[0];
    if (v) v.play().catch(() => {});
  }, []);

  function advance(from: number) {
    const next = (from + 1) % videos.length;
    setActive(next);
    const v = refs.current[next];
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }

  return (
    <div className="absolute inset-0">
      {videos.map((src, i) => (
        <video
          key={src}
          ref={(el) => { refs.current[i] = el; }}
          src={src}
          muted
          autoPlay={i === 0}
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
          onEnded={() => advance(i)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
            pointerEvents: "none",
            opacity: i === active ? 1 : 0,
            transition: "opacity 0.9s ease",
          }}
        />
      ))}
    </div>
  );
}
