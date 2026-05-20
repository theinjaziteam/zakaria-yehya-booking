"use client";

import { useEffect, useRef } from "react";

export function HeroVideo({ videos }: { videos: string[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const els: HTMLVideoElement[] = videos.map((src, i) => {
      const v = document.createElement("video");

      // Set every mute/autoplay attribute BEFORE src so iOS evaluates them
      // at the moment it first encounters the resource URL.
      v.muted = true;
      (v as HTMLVideoElement & { defaultMuted: boolean }).defaultMuted = true;
      v.setAttribute("muted", "");
      v.setAttribute("autoplay", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("x5-playsinline", "");
      v.setAttribute("preload", "auto");
      v.removeAttribute("controls");

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

      // Append BEFORE setting src — iOS reads muted/playsinline at src-set time
      wrap.appendChild(v);
      v.src = src;
      // Do NOT call v.load() — it resets the element into a paused state
      // and iOS will block the next play() call without a user gesture.

      return v;
    });

    function show(idx: number) {
      els.forEach((v, i) => { v.style.opacity = i === idx ? "1" : "0"; });
      const v = els[idx]!;
      v.currentTime = 0;
      // Never call load() here — it kills iOS autoplay permission for the element.
      v.play().catch(() => {});
    }

    els.forEach((v, i) => {
      v.addEventListener("ended", () => show((i + 1) % els.length));
    });

    // 100 ms lets the browser process the appended elements before play()
    const t = setTimeout(() => { els[0]!.play().catch(() => {}); }, 100);

    return () => {
      clearTimeout(t);
      els.forEach(v => { v.pause(); try { wrap.removeChild(v); } catch { /* already removed */ } });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrapRef} className="absolute inset-0" />;
}
