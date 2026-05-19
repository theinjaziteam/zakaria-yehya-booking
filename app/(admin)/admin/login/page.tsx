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

  // Inline styles only — no Tailwind spacing tokens (CSS vars) in layout
  // Those caused rightward shift on mobile before CSS loaded
  const page: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    background: "var(--bg)",
    overflowX: "hidden",
    overflowY: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const wrap: React.CSSProperties = {
    width: "100%",
    maxWidth: 380,
    padding: "32px 20px",
    boxSizing: "border-box",
  };

  const card: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    padding: 28,
  };

  const label: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "var(--muted-fg)",
    marginBottom: 8,
  };

  const input: React.CSSProperties = {
    display: "block",
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--input)",
    padding: "10px 0",
    fontSize: 16,
    color: "var(--fg)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const btn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    marginTop: 24,
    background: busy || !password ? "var(--muted-fg)" : "var(--ink)",
    color: "var(--canvas)",
    border: "none",
    borderRadius: 9999,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    cursor: busy || !password ? "default" : "pointer",
    opacity: busy || !password ? 0.5 : 1,
    transition: "opacity 0.2s",
  };

  return (
    <div style={page}>
      <div style={wrap}>
        {/* Brand */}
        <p style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--fg)", textAlign: "center", marginBottom: 32 }}>
          {clientConfig.brand.name}
        </p>

        <div style={card}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg)", marginBottom: 6 }}>
            Admin access
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-fg)", marginBottom: 24 }}>
            Enter your admin password to continue
          </p>

          <form onSubmit={handleSubmit}>
            <label style={label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
              placeholder="••••••••"
              autoFocus
              autoComplete="current-password"
              required
            />

            {error && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--warning)", marginTop: 10 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || !password} style={btn}>
              {busy ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
