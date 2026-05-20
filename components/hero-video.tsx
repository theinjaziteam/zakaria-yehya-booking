"use client";

import { useEffect, useRef } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Build video elements imperatively — setting muted BEFORE appendChild
    // is the only reliable way to get iOS Safari to autoplay without a play button.
    // React's JSX muted prop only sets the DOM property, not the HTML attribute,
    // so iOS ignores it when making the autoplay decision at insertion time.
    const els: HTMLVideoElement[] = videos.map((src, i) => {
      const v = document.createElement("video");
      // Set ALL attributes before appendChild so iOS reads them at insertion time
      v.muted = true;
      (v as HTMLVideoElement & { defaultMuted: boolean }).defaultMuted = true;
      v.setAttribute("muted", "");
      v.setAttribute("autoplay", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("preload", "auto");
      v.src = src;
      Object.assign(v.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center 40%",
        pointerEvents: "none",
        opacity: i === 0 ? "1" : "0",
        transition: "opacity 0.9s ease",
      });
      wrap.appendChild(v);
      // load() after appendChild so the browser can fetch using byte-range requests
      v.load();
      return v;
    });

    function show(idx: number) {
      els.forEach((v, i) => { v.style.opacity = i === idx ? "1" : "0"; });
      const v = els[idx]!;
      v.currentTime = 0;
      v.load();
      v.play().catch(() => {});
    }

    els.forEach((v, i) => {
      v.addEventListener("ended", () => show((i + 1) % els.length));
    });

    // Small delay gives the browser a frame to process the appended elements
    setTimeout(() => { els[0]!.play().catch(() => {}); }, 0);

    return () => { els.forEach(v => { v.pause(); wrap.removeChild(v); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrapRef} className="absolute inset-0" />;
}
