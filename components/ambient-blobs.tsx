"use client";

export function AmbientBlobs() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(134,95,16,0.07) 0%, transparent 70%)",
        top: "-10%", right: "-5%",
        animation: "blobFloat1 18s ease-in-out infinite",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(134,95,16,0.05) 0%, transparent 70%)",
        bottom: "20%", left: "-8%",
        animation: "blobFloat2 22s ease-in-out infinite",
        filter: "blur(50px)",
      }} />
      <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 40px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.97); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(40px, -30px) scale(1.08); }
          70% { transform: translate(-15px, 25px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
