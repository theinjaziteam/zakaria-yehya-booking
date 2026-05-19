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

  useEffect(() => {
    if (user) router.replace(from);
  }, [user, from, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    if (mode === "signin") {
      const error = await signIn(email, password);
      if (error) {
        setErr("Incorrect email or password.");
        setBusy(false);
      }
    } else {
      const error = await signUp(email, password);
      if (error) {
        if (error.toLowerCase().includes("already")) {
          setErr("Account already exists. Try signing in.");
          setMode("signin");
        } else {
          setErr(error);
        }
        setBusy(false);
      } else {
        setDone(true);
        setBusy(false);
      }
    }
  }

  // 16px minimum on inputs prevents iOS auto-zoom
  const inputBase =
    "w-full border-b border-input bg-transparent py-3 font-body text-base text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelBase =
    "font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg";

  return (
    // Scroll-safe layout: top-aligned so keyboard opening doesn't clip the form
    <main className="min-h-screen bg-bg overflow-y-auto">
      <div className="mx-auto w-full max-w-sm px-4 pt-12 pb-16 sm:pt-20">

        {/* Brand */}
        <Link
          href="/"
          className="block mb-8 font-display uppercase text-fg text-center transition-opacity hover:opacity-70"
          style={{ fontSize: "var(--wordmark-size)", letterSpacing: "var(--wordmark-tracking)" }}
        >
          {clientConfig.brand.name}
        </Link>

        {/* Card */}
        <div className="border border-border bg-card p-6 sm:p-8">
          {done ? (
            <div className="text-center grid gap-4">
              <p
                className="font-display uppercase text-fg"
                style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
              >
                Check your email
              </p>
              <p className="text-muted-fg text-sm leading-relaxed">
                We sent a confirmation link to{" "}
                <strong className="text-fg">{email}</strong>. Click it to
                activate your account, then sign in below.
              </p>
              <button
                onClick={() => { setDone(false); setMode("signin"); }}
                className="mt-2 h-11 w-full inline-flex items-center justify-center border border-fg font-mono text-xs uppercase tracking-widest text-fg hover:bg-fg hover:text-canvas transition-colors"
                style={{ borderRadius: "var(--radius-pill)" }}
              >
                Sign in →
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex mb-6">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setErr(null); }}
                    className="flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-colors border-b-2"
                    style={{
                      borderBottomColor: mode === m ? "var(--fg)" : "var(--border)",
                      color: mode === m ? "var(--fg)" : "var(--muted-fg)",
                    }}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5">
                {/* Email */}
                <div className="grid gap-1">
                  <label className={labelBase}>Email</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    className={inputBase}
                    placeholder="your@email.com"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>

                {/* Password */}
                <div className="grid gap-1">
                  <label className={labelBase}>Password</label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type={showPw ? "text" : "password"}
                      className={`${inputBase} pr-14`}
                      placeholder={mode === "signup" ? "6 or more characters" : "Your password"}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-0 bottom-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg hover:text-fg transition-colors"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {err && (
                  <p className="font-mono text-[0.65rem] uppercase tracking-widest text-warning">
                    {err}
                  </p>
                )}

                {/* Submit — full width always */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 inline-flex items-center justify-center font-mono text-sm uppercase tracking-widest transition-opacity disabled:opacity-40 hover:opacity-80 mt-1"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    background: "var(--ink)",
                    color: "var(--canvas)",
                  }}
                >
                  {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {mode === "signup" && (
                <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg leading-relaxed">
                  Your account is also created automatically when you complete a booking.
                </p>
              )}
            </>
          )}
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg hover:text-fg transition-colors"
          >
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
