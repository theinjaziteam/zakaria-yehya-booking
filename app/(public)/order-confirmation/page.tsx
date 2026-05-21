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
      return new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch { return d; }
  }

  const pickupText = date && time
    ? `${fmtDate(date)} at ${time} — Verdun salon, Rashid Karameh Street, Beirut`
    : "";

  const whatsappMsg = encodeURIComponent(
    `My order is confirmed at Yehïa & Zakarïa!\n\nRef: ${ref}\nPickup: ${pickupText}\n\nSee you then!`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMsg}`;

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--canvas)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      animation: "pageFadeIn 420ms cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>

        {/* Check icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid #1C1714", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1714" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 5vw, 2.5rem)", textTransform: "uppercase", letterSpacing: "0.05em", color: "#1C1714", marginBottom: 4 }}>
          Order confirmed
        </p>
        {name && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginBottom: 28 }}>
            Thank you, {name}
          </p>
        )}

        {/* Reference */}
        <div style={{ background: "#fff", border: "1px solid rgba(28,23,20,0.1)", padding: "18px 24px", marginBottom: 12 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginBottom: 6 }}>
            Order reference
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#1C1714" }}>
            {ref}
          </p>
        </div>

        {/* Pickup */}
        {date && time && (
          <div style={{ background: "#fff", border: "1px solid rgba(28,23,20,0.1)", padding: "18px 24px", marginBottom: 12 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginBottom: 8 }}>
              Pickup
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#1C1714" }}>
              {fmtDate(date)}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "rgba(28,23,20,0.55)", marginTop: 4 }}>
              {time} · Verdun salon
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "rgba(28,23,20,0.4)", marginTop: 2 }}>
              Rashid Karameh Street, Shad Building
            </p>
          </div>
        )}

        {/* My bookings note */}
        <div style={{ background: "rgba(134,95,16,0.06)", border: "1px solid rgba(134,95,16,0.18)", padding: "14px 20px", marginBottom: 28, textAlign: "left" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#865F10", marginBottom: 4 }}>
            Track your order
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(28,23,20,0.7)" }}>
            This order appears in{" "}
            <Link href="/my-bookings" style={{ color: "#865F10", textDecoration: "underline", textDecorationColor: "rgba(134,95,16,0.4)" }}>
              My bookings
            </Link>
            {" "}— look it up any time with your reference code.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>

          {/* WhatsApp share — primary action */}
          {date && time && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                maxWidth: 320,
                height: 48,
                borderRadius: 9999,
                background: "#25D366",
                color: "#fff",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Send pickup time to myself
            </a>
          )}

          <Link
            href="/"
            style={{
              display: "inline-flex",
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              padding: "0 2rem",
              borderRadius: 9999,
              border: "1px solid rgba(28,23,20,0.3)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#1C1714",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            Back to home
          </Link>

          <Link
            href="/book"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(28,23,20,0.4)",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
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
