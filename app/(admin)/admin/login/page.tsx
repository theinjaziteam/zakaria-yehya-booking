"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientConfig } from "@/config/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/admin/bookings");
    } else {
      setError("Incorrect password.");
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#F9F6F1",
      overflowX: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
      boxSizing: "border-box",
    }}>
      <div style={{ width: "100%", maxWidth: 360, boxSizing: "border-box" }}>

        {/* Brand */}
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: 12,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(28,23,20,0.45)",
          textAlign: "center",
          marginBottom: 28,
          animation: "loginCardIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both",
        }}>
          {clientConfig.brand.name}
        </p>

        {/* Card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid rgba(28,23,20,0.1)",
          padding: "36px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          animation: "loginCardIn 0.65s cubic-bezier(0.22,1,0.36,1) 0.12s both",
          boxSizing: "border-box",
        }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#865F10",     // gold accent
            marginBottom: 10,
          }}>
            Admin
          </p>

          {/* Heading */}
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#1C1714",
            marginBottom: 24,
            lineHeight: 1.1,
          }}>
            Enter password
          </p>

          <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

          <form onSubmit={handleSubmit}>
            {/* Password input */}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              autoComplete="current-password"
              required
              style={{
                display: "block",
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${error ? "var(--warning)" : "var(--input)"}`,
                padding: "10px 0",
                fontSize: 16,
                color: "#1C1714",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: error ? 8 : 24,
                transition: "border-color 0.2s",
              }}
              onFocus={e => { e.currentTarget.style.borderBottomColor = "#1C1714"; }}
              onBlur={e => { e.currentTarget.style.borderBottomColor = error ? "var(--warning)" : "var(--input)"; }}
            />

            {error && (
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--warning)",
                marginBottom: 20,
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !password}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 48,
                background: busy || !password ? "rgba(28,23,20,0.3)" : "#1C1714",
                color: "#F9F6F1",
                border: "none",
                borderRadius: 9999,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                cursor: busy || !password ? "default" : "pointer",
                transition: "background 0.2s, transform 0.15s",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={e => { if (!busy && password) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              {busy ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(28,23,20,0.35)",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}>
            ← Back to site
          </a>
        </p>
      </div>
    </div>
  );
}
