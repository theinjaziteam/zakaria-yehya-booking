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
  const [done, setDone] = useState(false);

  // Already signed in — redirect immediately
  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    if (mode === "signin") {
      const err = await signIn(email, password);
      if (err) {
        setErr("Incorrect email or password.");
        setBusy(false);
      }
      // success: useEffect above will redirect
    } else {
      const err = await signUp(email, password);
      if (err) {
        if (err.toLowerCase().includes("already")) {
          setErr("An account with this email already exists. Try signing in.");
          setMode("signin");
        } else {
          setErr(err);
        }
        setBusy(false);
      } else {
        setDone(true);
        setBusy(false);
      }
    }
  }

  const inputBase = "w-full border-b border-input bg-transparent py-sm font-body text-[length:var(--body-md-size)] text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelBase = "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-md">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <Link
          href="/"
          className="block mb-xl font-display uppercase text-fg text-center transition-opacity hover:opacity-70"
          style={{ fontSize: "var(--wordmark-size)", letterSpacing: "var(--wordmark-tracking)" }}
        >
          {clientConfig.brand.name}
        </Link>

        <div className="border border-border bg-card p-lg sm:p-xl">
          {done ? (
            <div className="text-center grid gap-md">
              <p className="font-display uppercase text-fg" style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}>
                Check your email
              </p>
              <p className="text-muted-fg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}>
                We sent a confirmation link to <strong className="text-fg">{email}</strong>. Click it to activate your account, then come back and sign in.
              </p>
              <button
                onClick={() => { setDone(false); setMode("signin"); }}
                className="mt-sm h-10 inline-flex items-center justify-center border border-fg px-6 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg hover:bg-fg hover:text-canvas transition-colors"
                style={{ borderRadius: "var(--radius-pill)" }}
              >
                Sign in →
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-lg border-b border-border pb-sm">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setErr(null); }}
                    className={[
                      "flex-1 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors",
                      mode === m ? "bg-card text-fg border border-border" : "text-muted-fg hover:text-fg",
                    ].join(" ")}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="grid gap-md">
                <div className="grid gap-xs">
                  <label className={labelBase}>Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputBase} placeholder="your@email.com" autoComplete="email" required />
                </div>

                <div className="grid gap-xs">
                  <label className={labelBase}>Password</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type={showPw ? "text" : "password"}
                      className={`${inputBase} pr-14`}
                      placeholder={mode === "signup" ? "Choose a password (6+ chars)" : "Your password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className={`absolute right-0 bottom-sm ${labelBase} hover:opacity-70`}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {err && (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-warning">{err}</p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-xs h-11 inline-flex items-center justify-center font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity disabled:opacity-40 hover:opacity-80"
                  style={{ borderRadius: "var(--radius-pill)", background: "var(--ink)", color: "var(--canvas)" }}
                >
                  {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {mode === "signup" && (
                <p className="mt-md font-mono text-[10px] uppercase tracking-widest text-muted-fg">
                  You can also create an account during the booking process.
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-md text-center">
          <Link href="/" className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg hover:text-fg transition-colors">
            ← Back to site
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
