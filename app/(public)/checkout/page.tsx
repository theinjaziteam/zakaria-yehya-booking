"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

// Earliest pickup is tomorrow; allow up to 30 days ahead
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const PICKUP_TIMES = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalCents, clearCart } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  // Redirect if cart is empty — but not after a successful submit (cart cleared on success)
  useEffect(() => {
    if (items.length === 0 && !submitted) router.replace("/");
  }, [items.length, router, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !pickupDate || !pickupTime) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_email: email.trim() || null,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          items: items.map(({ product_id, product_name, quantity, unit_price_cents }) => ({
            product_id, product_name, quantity, unit_price_cents,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Order failed — please try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      clearCart();
      router.push(`/order-confirmation?ref=${json.reference_code}&date=${pickupDate}&time=${pickupTime}&name=${encodeURIComponent(name.trim())}`);
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  if (items.length === 0 && !submitted) return null;

  const inp = "w-full border border-border bg-bg px-3 py-2.5 font-mono text-sm text-fg focus:border-fg focus:outline-none";
  const lbl = "block font-mono text-xs uppercase tracking-widest text-muted-fg mb-1.5";

  return (
    <main style={{ minHeight: "100vh", background: "var(--canvas)", animation: "pageFadeIn 420ms cubic-bezier(0.22,1,0.36,1) both" }}>
      {/* Nav */}
      <nav className="border-b border-border px-md py-4 sm:px-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="font-mono text-xs uppercase tracking-widest text-muted-fg transition-opacity hover:opacity-70">
            ← Back
          </Link>
          <p className="font-display text-sm uppercase tracking-widest text-fg">Checkout</p>
          <span />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-md py-xl sm:px-xl">
        <div className="grid gap-xl lg:grid-cols-[1fr_360px] lg:items-start">

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div>
              <p className="font-display text-2xl uppercase tracking-wide text-fg mb-xs">Your details</p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">
                {user ? `Signed in as ${user.email}` : "No account needed"}
              </p>
            </div>

            <div>
              <label className={lbl}>Full name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Phone *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+961 76 000 000" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Email <span className="normal-case text-muted-fg">(optional)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={inp} />
            </div>

            <div className="border-t border-border pt-5">
              <p className="font-display text-xl uppercase tracking-wide text-fg mb-4">Pickup at the salon</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Date *</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)}
                    min={minDate()}
                    max={maxDate()}
                    required
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Time *</label>
                  <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} required className={inp}>
                    <option value="">Select time…</option>
                    {PICKUP_TIMES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-fg">
                Verdun salon · Rashid Karameh Street, Beirut
              </p>
            </div>

            {error && <p className="font-mono text-xs uppercase tracking-widest text-warning">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full border border-fg font-mono text-sm uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas disabled:opacity-50"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              {loading ? "Placing order…" : `Place order · ${fmt(totalCents)}`}
            </button>
          </form>

          {/* Order summary */}
          <div className="border border-border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-4">Order summary</p>
            <div className="grid gap-3">
              {items.map(item => (
                <div key={item.product_id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.product_name} className="h-12 w-12 shrink-0 object-cover border border-border" />
                    )}
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wide text-fg">{item.product_name}</p>
                      <p className="font-mono text-xs text-muted-fg">× {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-fg shrink-0">{fmt(item.unit_price_cents * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-3 flex justify-between">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">Total</p>
              <p className="font-mono text-base text-fg">{fmt(totalCents)}</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
