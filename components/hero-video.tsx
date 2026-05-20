"use client";

import { useState, useRef, useEffect } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const [front, setFront] = useState<0 | 1>(0);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    [refA, refB].forEach(r => {
      const v = r.current;
      if (!v) return;
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
    });
  }, []);

  function handleEnded(slot: 0 | 1) {
    const nextRef = slot === 0 ? refB : refA;
    const v = nextRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    setFront(slot === 0 ? 1 : 0);
  }

  // Both have autoPlay — iOS won't show a play button on a playing video.
  // No zIndex — DOM order keeps videos behind the gradient + text above them.
  return (
    <>
      <video
        ref={refA}
        src={videos[0]}
        autoPlay muted playsInline preload="auto"
        onEnded={() => handleEnded(0)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 40%", pointerEvents: "none", opacity: front === 0 ? 1 : 0, transition: "opacity 0.9s ease" }}
      />
      <video
        ref={refB}
        src={videos[1] ?? videos[0]}
        autoPlay muted playsInline preload="auto"
        onEnded={() => handleEnded(1)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 40%", pointerEvents: "none", opacity: front === 1 ? 1 : 0, transition: "opacity 0.9s ease" }}
      />
    </>
  );
}
