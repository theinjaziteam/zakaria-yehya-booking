"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

function SignInDropdown({ onClose, redirectAfter }: { onClose: () => void; redirectAfter?: string }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputCls = "w-full border-b border-input bg-transparent py-2 text-sm text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelCls = "font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg mb-1 block";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const signInErr = await signIn(email, password);
    if (signInErr) {
      const signUpErr = await signUp(email, password);
      if (signUpErr) {
        setErr("Wrong password, or try a different email.");
        setBusy(false);
        return;
      }
    }
    onClose();
    if (redirectAfter) window.location.href = redirectAfter;
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-72 border border-border bg-bg shadow-lg z-50 p-4 grid gap-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg">
        Sign in or create account
      </p>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <div>
          <label className={labelCls}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} placeholder="your@email.com" autoComplete="email" required />
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputCls} placeholder="6+ characters" autoComplete="current-password" required />
        </div>
        {err && <p className="font-mono text-[0.6rem] uppercase tracking-widest text-warning">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-9 w-full font-mono text-[0.65rem] uppercase tracking-widest transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{ background: "var(--ink)", color: "var(--canvas)" }}
        >
          {busy ? "…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export function NavActions() {
  const { user, loading, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInRedirect, setSignInRedirect] = useState<string | undefined>(undefined);

  function openSignIn(redirect?: string) {
    setSignInRedirect(redirect);
    setShowSignIn(true);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* My Bookings — smart: signed in goes to page, guest prompts sign-in */}
      {!loading && (
        user ? (
          <Link
            href="/my-bookings"
            className="inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            My bookings
          </Link>
        ) : (
          <button
            onClick={() => openSignIn("/my-bookings")}
            className="inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            My bookings
          </button>
        )
      )}

      {/* Sign in / out */}
      {!loading && (
        <div className="relative">
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden sm:inline-flex h-8 items-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 px-1"
              title={`Signed in as ${user.email}`}
            >
              {user.email?.split("@")[0]} · sign out
            </button>
          ) : (
            <>
              <button
                onClick={() => openSignIn()}
                className="hidden sm:inline-flex h-8 items-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70 px-1"
              >
                Sign in
              </button>
              {showSignIn && (
                <SignInDropdown
                  onClose={() => setShowSignIn(false)}
                  redirectAfter={signInRedirect}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
