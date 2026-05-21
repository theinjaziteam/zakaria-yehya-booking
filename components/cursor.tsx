"use client";

import { useEffect, useRef } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let mx = -100, my = -100, rx = -100, ry = -100;
    let visible = false;

    function onMove(e: MouseEvent) {
      mx = e.clientX; my = e.clientY;
      if (!visible) { dot.style.opacity = "1"; ring.style.opacity = "1"; visible = true; }
    }
    function onLeave() { dot.style.opacity = "0"; ring.style.opacity = "0"; visible = false; }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    let frame: number;
    function tick() {
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    // Scale ring on hoverable elements
    function onEnter() { ring.style.transform += " scale(1.6)"; ring.style.borderColor = "rgba(134,95,16,0.9)"; }
    function onExit() { ring.style.borderColor = "rgba(134,95,16,0.55)"; }
    const links = document.querySelectorAll("a, button, [role=button]");
    links.forEach(el => { el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onExit); });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      links.forEach(el => { el.removeEventListener("mouseenter", onEnter); el.removeEventListener("mouseleave", onExit); });
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 9999, pointerEvents: "none",
          width: 8, height: 8, borderRadius: "50%", background: "#865F10", opacity: 0,
          transition: "opacity 0.2s",
          willChange: "transform",
        }}
      />
      {/* Ring */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 9998, pointerEvents: "none",
          width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(134,95,16,0.55)",
          opacity: 0, transition: "opacity 0.2s, border-color 0.2s, transform 0.1s",
          willChange: "transform",
        }}
      />
    </>
  );
}
