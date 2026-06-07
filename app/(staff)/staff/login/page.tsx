"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientConfig } from "@/config/client";

export default function StaffLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/staff/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }
    router.push("/staff/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F1", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(28,23,20,0.72)", textAlign: "center", marginBottom: 28 }}>
          {clientConfig.brand.name}
        </p>

        <div style={{ background: "#fff", border: "1px solid rgba(28,23,20,0.18)", padding: "36px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C1714", marginBottom: 24 }}>
            Staff login
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.72)", marginBottom: 6 }}>Your PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter your PIN"
                autoComplete="current-password"
                autoFocus
                style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.38)", background: "transparent", padding: "8px 0", fontFamily: "var(--font-body)", fontSize: 15, color: "#1C1714", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4871F" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !pin}
              style={{ marginTop: 8, padding: "12px", background: "#1C1714", color: "#F9F6F1", border: "none", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", opacity: loading || !pin ? 0.5 : 1 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Back link — below card, matching admin login style */}
        <p style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(28,23,20,0.62)", textDecoration: "none" }}>
            ← Back to site
          </a>
        </p>
      </div>
    </div>
  );
}
