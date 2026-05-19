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
    <main className="min-h-screen bg-bg flex items-center justify-center px-md">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <p
          className="mb-xl font-display uppercase text-fg text-center"
          style={{ fontSize: "var(--wordmark-size)", letterSpacing: "var(--wordmark-tracking)" }}
        >
          {clientConfig.brand.name}
        </p>

        {/* Card */}
        <div className="border border-border bg-card p-lg sm:p-xl">
          <p
            className="mb-xs font-display uppercase text-fg"
            style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
          >
            Admin access
          </p>
          <p
            className="mb-lg font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg"
          >
            Enter your admin password to continue
          </p>

          <form onSubmit={handleSubmit} className="grid gap-md">
            <div className="grid gap-xs">
              <label className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                className="w-full border-b border-input bg-transparent py-sm font-body text-[length:var(--body-md-size)] text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || password.length === 0}
              className="mt-xs h-11 inline-flex items-center justify-center font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity disabled:opacity-40 hover:opacity-80"
              style={{
                borderRadius: "var(--radius-pill)",
                background: "var(--ink)",
                color: "var(--canvas)",
              }}
            >
              {busy ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
