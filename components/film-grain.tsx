"use client";

export function FilmGrain() {
  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </svg>
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none",
          filter: "url(#grain)",
          opacity: 0.045,
          background: "transparent",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}
