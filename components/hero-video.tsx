"use client";

import { useState, useRef, useEffect } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const [front, setFront] = useState<0 | 1>(0);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // iOS requires these attributes set directly on the element
    [refA, refB].forEach(r => {
      const v = r.current;
      if (!v) return;
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
    });
    // Start video A — B is preloading silently in the background
    refA.current?.play().catch(() => {});
  }, []);

  function handleEnded(slot: 0 | 1) {
    const nextRef = slot === 0 ? refB : refA;
    const v = nextRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    setFront(slot === 0 ? 1 : 0);
  }

  const base = "absolute inset-0 h-full w-full object-cover";

  const styleFor = (slot: 0 | 1): React.CSSProperties => ({
    objectPosition: "center 40%",
    pointerEvents: "none",
    opacity: front === slot ? 1 : 0,
    zIndex: front === slot ? 1 : 0,
    transition: "opacity 0.9s ease",
  });

  return (
    <>
      {/* Video A — autoPlay in markup so iOS starts it immediately */}
      <video
        ref={refA}
        src={videos[0]}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => handleEnded(0)}
        className={base}
        style={styleFor(0)}
      />
      {/* Video B — preloads silently, plays when A ends */}
      <video
        ref={refB}
        src={videos[1] ?? videos[0]}
        muted
        playsInline
        preload="auto"
        onEnded={() => handleEnded(1)}
        className={base}
        style={styleFor(1)}
      />
    </>
  );
}
