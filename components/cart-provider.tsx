"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  useRef, type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import type { Product } from "@/components/products-section";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CartItem = {
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  image_url: string | null;
};

type CartCtx = {
  items: CartItem[];
  addItem: (product: Product) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  itemCount: number;
  totalCents: number;
};

const CartContext = createContext<CartCtx>({
  items: [], addItem: () => {}, updateQty: () => {}, removeItem: () => {},
  clearCart: () => {}, openCart: () => {}, itemCount: 0, totalCents: 0,
});

export function useCart() { return useContext(CartContext); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

const STORAGE_KEY = "yz_cart";

function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartItem[]; }
  catch { return []; }
}

function saveCart(items: CartItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

// ── Checkout form inside drawer ───────────────────────────────────────────────

function CheckoutForm({
  items, totalCents, onSuccess, onCancel,
}: {
  items: CartItem[];
  totalCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Keep email in sync if user signs in while the drawer is open
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const inputCls = "w-full border-b border-input bg-transparent py-2 text-sm text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelCls = "font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErr("Please fill in name, phone and email.");
      return;
    }
    setBusy(true);
    setErr(null);

    // Sign in / sign up if not already authenticated
    if (!user) {
      try {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
        const sb = createBrowserSupabaseClient();
        if (password.length >= 6) {
          const { error: siErr } = await sb.auth.signInWithPassword({ email, password });
          if (siErr) await sb.auth.signUp({ email, password });
        }
      } catch { /* proceed even without auth */ }
    }

    const payload = {
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_email: email.trim(),
      items: items.map(({ product_id, product_name, quantity, unit_price_cents }) => ({
        product_id, product_name, quantity, unit_price_cents,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr((j as { error?: string }).error ?? "Order failed — please try again.");
        setBusy(false);
        return;
      }
      onSuccess();
    } catch {
      setErr("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 border-t border-border pt-4 mt-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg">Your details</p>

      {user ? (
        <div className="flex items-center justify-between border border-border px-3 py-2">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-fg">{user.email}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <div>
            <p className={labelCls}>Email</p>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} placeholder="your@email.com" required />
          </div>
          <div>
            <p className={labelCls}>Password <span className="normal-case tracking-normal">(creates or signs into your account)</span></p>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className={inputCls} placeholder="6+ characters" autoComplete="current-password" />
          </div>
        </div>
      )}

      <div>
        <p className={labelCls}>Full name</p>
        <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" required />
      </div>
      <div>
        <p className={labelCls}>Phone</p>
        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className={inputCls} placeholder="+961 76 000 000" required />
      </div>

      {err && <p className="font-mono text-[0.65rem] uppercase tracking-widest text-warning">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 h-11 font-mono text-[0.7rem] uppercase tracking-widest transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{ background: "var(--accent)", color: "var(--canvas)" }}
        >
          {busy ? "Placing…" : `Place order · ${fmt(totalCents)}`}
        </button>
        <button type="button" onClick={onCancel} className="h-11 px-4 border border-border font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg hover:border-fg hover:text-fg transition-colors">
          Back
        </button>
      </div>
    </form>
  );
}

// ── Cart drawer ───────────────────────────────────────────────────────────────

function CartDrawer({
  open, onClose, items, totalCents, updateQty, removeItem, clearCart,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  totalCents: number;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}) {
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);

  // Reset internal state when drawer closes
  useEffect(() => {
    if (!open) { setCheckout(false); setDone(false); }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink/20"
        style={{ backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-bg border-l border-border shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-mono text-[0.75rem] uppercase tracking-widest text-fg">
            Cart {items.length > 0 && `(${items.reduce((s, i) => s + i.quantity, 0)})`}
          </p>
          <button
            onClick={onClose}
            className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg hover:text-fg transition-colors"
          >
            Close ✕
          </button>
        </div>

        <div className="flex-1 px-5 py-4">
          {done ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="font-display text-2xl uppercase tracking-wide text-fg">Order placed</p>
              <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg">
                We&apos;ll be in touch to confirm.
              </p>
              <button
                onClick={() => { clearCart(); onClose(); }}
                className="mt-4 h-10 px-6 border border-fg font-mono text-[0.7rem] uppercase tracking-widest text-fg hover:bg-fg hover:text-canvas transition-colors"
              >
                Done
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg">
              Your cart is empty.
            </p>
          ) : checkout ? (
            <CheckoutForm
              items={items}
              totalCents={totalCents}
              onSuccess={() => setDone(true)}
              onCancel={() => setCheckout(false)}
            />
          ) : (
            <>
              {/* Item list */}
              <div className="grid gap-4">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-start gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.product_name} className="h-14 w-14 shrink-0 object-cover border border-border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[0.7rem] uppercase tracking-wide text-fg truncate">{item.product_name}</p>
                      <p className="font-mono text-[0.65rem] text-muted-fg">{fmt(item.unit_price_cents)} each</p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          onClick={() => item.quantity > 1 ? updateQty(item.product_id, item.quantity - 1) : removeItem(item.product_id)}
                          className="h-6 w-6 border border-border text-fg font-mono text-sm hover:bg-fg hover:text-canvas transition-colors flex items-center justify-center"
                        >−</button>
                        <span className="font-mono text-sm text-fg w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          className="h-6 w-6 border border-border text-fg font-mono text-sm hover:bg-fg hover:text-canvas transition-colors flex items-center justify-center"
                        >+</button>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[0.7rem] text-fg">{fmt(item.unit_price_cents * item.quantity)}</p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-fg hover:text-warning transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + checkout */}
              <div className="mt-6 border-t border-border pt-4 grid gap-3">
                <div className="flex justify-between">
                  <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-fg">Total</p>
                  <p className="font-mono text-[0.9rem] text-fg">{fmt(totalCents)}</p>
                </div>
                <button
                  onClick={() => setCheckout(true)}
                  className="h-12 w-full font-mono text-[0.75rem] uppercase tracking-widest transition-opacity hover:opacity-80"
                  style={{ background: "var(--ink)", color: "var(--canvas)" }}
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    setItems(loadCart());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) saveCart(items);
  }, [items]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        unit_price_cents: product.price_cents,
        quantity: 1,
        image_url: product.image_url,
      }];
    });
    // Don't open drawer — checkout flow is via the dedicated /checkout page
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev.map((i) => i.product_id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setDrawerOpen(true), []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalCents = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, openCart, itemCount, totalCents }}>
      {children}
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={items}
        totalCents={totalCents}
        updateQty={updateQty}
        removeItem={removeItem}
        clearCart={clearCart}
      />
    </CartContext.Provider>
  );
}
