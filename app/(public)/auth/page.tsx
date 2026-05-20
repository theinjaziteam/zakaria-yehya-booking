"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientConfig } from "@/config/client";
import { useAuth } from "@/components/auth-provider";

function AuthForm() {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/my-bookings";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    if (mode === "signin") {
      const error = await signIn(email, password);
      if (error) { setErr("Incorrect email or password."); setBusy(false); }
    } else {
      const error = await signUp(email, password);
      if (error) { setErr(error); setBusy(false); }
      // success: onAuthStateChange fires, useEffect redirects
    }
  }

  // ─── Styles (pixel values only — no CSS var tokens in layout) ────────────
  const page: React.CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    background: "var(--bg)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch" as never,
  };

  const wrap: React.CSSProperties = {
    maxWidth: 400,
    width: "100%",
    margin: "0 auto",
    padding: "48px 20px 64px",
    boxSizing: "border-box",
  };

  const card: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    padding: 24,
  };

  const input: React.CSSProperties = {
    display: "block",
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--input)",
    padding: "10px 0",
    fontSize: 16,             // 16px prevents iOS auto-zoom
    color: "var(--fg)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const label: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "var(--muted-fg)",
    marginBottom: 6,
  };

  const btn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    background: "var(--ink)",
    color: "var(--canvas)",
    border: "none",
    borderRadius: 9999,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    cursor: "pointer",
    opacity: busy ? 0.5 : 1,
  };

  if (done) {
    return (
      <div style={page}>
        <div style={wrap}>
          <Link href="/" style={{ display:"block", textAlign:"center", marginBottom:32, fontFamily:"var(--font-display)", fontSize:14, letterSpacing:"0.35em", textTransform:"uppercase", color:"var(--fg)", textDecoration:"none" }}>
            {clientConfig.brand.name}
          </Link>
          <div style={{ ...card, textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-display)", fontSize:20, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--fg)", marginBottom:12 }}>
              Check your email
            </p>
            <p style={{ fontSize:14, color:"var(--muted-fg)", lineHeight:1.7, marginBottom:20 }}>
              We sent a link to <strong style={{ color:"var(--fg)" }}>{email}</strong>. Click it to activate your account, then sign in.
            </p>
            <button onClick={() => { setDone(false); setMode("signin"); }}
              style={{ ...btn, width:"auto", padding:"0 24px", background:"transparent", border:"1px solid var(--fg)", color:"var(--fg)" }}>
              Sign in →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={wrap}>
        {/* Brand */}
        <Link href="/" style={{ display:"block", textAlign:"center", marginBottom:32, fontFamily:"var(--font-display)", fontSize:14, letterSpacing:"0.35em", textTransform:"uppercase", color:"var(--fg)", textDecoration:"none" }}>
          {clientConfig.brand.name}
        </Link>

        {/* Card */}
        <div style={card}>
          {/* Tabs */}
          <div style={{ display:"flex", marginBottom:24, borderBottom:"1px solid var(--border)" }}>
            {(["signin","signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setErr(null); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${mode === m ? "var(--fg)" : "transparent"}`,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: mode === m ? "var(--fg)" : "var(--muted-fg)",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:"grid", gap:20 }}>
            {/* Email */}
            <div>
              <label style={label}>Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                style={input}
                placeholder="your@email.com"
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={label}>Password</label>
              <div style={{ position:"relative" }}>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  style={{ ...input, paddingRight: 48 }}
                  placeholder={mode === "signup" ? "6 or more characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  style={{ position:"absolute", right:0, bottom:10, background:"none", border:"none", fontFamily:"var(--font-mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-fg)", cursor:"pointer" }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {err && (
              <p style={{ fontFamily:"var(--font-mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--warning)", margin:0 }}>
                {err}
              </p>
            )}

            <button type="submit" disabled={busy} style={btn}>
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "signup" && (
            <p style={{ marginTop:16, fontFamily:"var(--font-mono)", fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-fg)", lineHeight:1.6 }}>
              Your account is also created automatically when you complete a booking.
            </p>
          )}
        </div>

        <div style={{ marginTop:16, textAlign:"center" }}>
          <Link href="/" style={{ fontFamily:"var(--font-mono)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--muted-fg)", textDecoration:"none" }}>
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
