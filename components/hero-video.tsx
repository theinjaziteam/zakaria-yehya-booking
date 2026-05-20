"use client";

import { useRef, useEffect } from "react";

type Props = { videos: string[] };

export function HeroVideo({ videos }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // Belt-and-suspenders for older iOS — set attributes directly on element
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    const onEnded = () => {
      idxRef.current = (idxRef.current + 1) % videos.length;
      v.src = videos[idxRef.current]!;
      v.load();
      v.play().catch(() => {});
    };

    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // src in JSX (not set via JS) — iOS requires src to be in the markup
  // for autoPlay + muted + playsInline to trigger without user interaction.
  // No poster — prevents the native play-button overlay entirely.
  return (
    <video
      ref={ref}
      src={videos[0]}
      autoPlay
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 40%", pointerEvents: "none" }}
    />
  );
}
