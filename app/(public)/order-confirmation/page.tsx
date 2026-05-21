"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ConfirmationContent() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "—";
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const name = params.get("name") ?? "";

  function fmtDate(d: string) {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    } catch { return d; }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--canvas)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", animation: "pageFadeIn 420ms cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        {/* Check icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>

        <p className="font-display text-3xl uppercase tracking-wide text-fg mb-2">Order confirmed</p>
        {name && (
          <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-6">
            Thank you, {name}
          </p>
        )}

        {/* Reference */}
        <div style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "20px 24px", marginBottom: 20 }}>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Order reference</p>
          <p className="font-display text-2xl uppercase tracking-widest text-fg">{ref}</p>
        </div>

        {/* Pickup details */}
        {date && time && (
          <div style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "20px 24px", marginBottom: 32 }}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-3">Pickup</p>
            <p className="font-display text-lg uppercase tracking-wide text-fg">{fmtDate(date)}</p>
            <p className="font-mono text-sm text-muted-fg mt-1">{time} · Verdun salon</p>
            <p className="font-mono text-xs text-muted-fg mt-1">Rashid Karameh Street, Shad Building</p>
          </div>
        )}

        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-8">
          Your products will be ready at the salon. Bring this reference code when you arrive.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center border border-fg px-8 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            Back to home
          </Link>
          <Link href="/book" className="font-mono text-xs uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70">
            Also book an appointment →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--canvas)" }} />}>
      <ConfirmationContent />
    </Suspense>
  );
}
