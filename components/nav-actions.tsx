"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";

function SignInDropdown({ onClose }: { onClose: () => void }) {
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
    // Try sign-in; fall back to sign-up automatically
    const signInErr = await signIn(email, password);
    if (signInErr) {
      const signUpErr = await signUp(email, password);
      if (signUpErr) {
        setErr(signInErr); // show original sign-in error
        setBusy(false);
        return;
      }
    }
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-72 border border-border bg-bg shadow-lg z-50 p-4 grid gap-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg">Sign in or create account</p>
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
  const { itemCount, openCart } = useCart();
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Cart button */}
      <button
        onClick={openCart}
        className="relative inline-flex h-8 items-center justify-center border border-border px-3 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:border-fg"
        aria-label="Open cart"
      >
        Cart
        {itemCount > 0 && (
          <span
            className="ml-1.5 inline-flex h-4 w-4 items-center justify-center font-mono text-[0.6rem] text-canvas"
            style={{ background: "var(--accent)", borderRadius: "9999px" }}
          >
            {itemCount}
          </span>
        )}
      </button>

      {/* My Bookings */}
      <Link
        href="/my-bookings"
        className="inline-flex h-8 items-center justify-center border border-fg px-3 sm:px-4 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        My bookings
      </Link>

      {/* Auth */}
      {!loading && (
        <div className="relative">
          {user ? (
            <button
              onClick={() => signOut()}
              className="hidden sm:inline-flex h-8 items-center justify-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70"
              title={`Signed in as ${user.email}`}
            >
              {user.email?.split("@")[0]} ·&nbsp;out
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowSignIn((v) => !v)}
                className="hidden sm:inline-flex h-8 items-center justify-center font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70"
              >
                Sign in
              </button>
              {showSignIn && <SignInDropdown onClose={() => setShowSignIn(false)} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
