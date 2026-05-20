"use client";

import { useRef, useEffect } from "react";

type Props = { videos: string[]; poster: string };

export function HeroVideo({ videos, poster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    // Set directly on the element — belt-and-suspenders for iOS/Android
    v.muted = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    v.setAttribute("x-webkit-airplay", "deny");

    function playNext() {
      idxRef.current = (idxRef.current + 1) % videos.length;
      v!.src = videos[idxRef.current]!;
      v!.load();
      v!.play().catch(() => {});
    }

    v.src = videos[0]!;
    v.load();
    v.play().catch(() => {});
    v.addEventListener("ended", playNext);

    return () => v.removeEventListener("ended", playNext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      poster={poster}
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: "center 40%", pointerEvents: "none" }}
    />
  );
}
