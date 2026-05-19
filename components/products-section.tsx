"use client";

import { useState } from "react";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

type OrderItem = { product_id: string; product_name: string; quantity: number; unit_price_cents: number };
type FormState = "idle" | "open" | "submitting" | "done" | "error";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function ProductCard({ product }: { product: Product }) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setFormState("submitting");
    setErrorMsg(null);

    const item: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price_cents: product.price_cents,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_phone: phone,
          customer_email: email,
          items: [item],
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg((j as { error?: string }).error ?? "Order failed. Please try again.");
        setFormState("error");
        return;
      }

      setFormState("done");
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
      setFormState("error");
    }
  }

  const labelBase = "font-mono text-[0.75rem] uppercase tracking-[0.12em] text-muted-fg";
  const inputBase =
    "w-full border-b border-input bg-transparent py-2 font-body text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors text-sm";

  return (
    <article className="border border-border bg-card">
      {product.image_url && (
        <div className="relative overflow-hidden" style={{ height: "200px" }}>
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-md">
        <div className="mb-sm flex items-start justify-between gap-sm">
          <h3
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)" }}
          >
            {product.name}
          </h3>
          <p
            className="shrink-0 font-mono text-fg"
            style={{ fontSize: "var(--title-sm-size)", letterSpacing: "0.05em" }}
          >
            {formatPrice(product.price_cents)}
          </p>
        </div>

        {product.description && (
          <p className="mb-md text-muted-fg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.65 }}>
            {product.description}
          </p>
        )}

        {formState === "done" ? (
          <div className="border border-border px-md py-sm">
            <p className={labelBase}>Order received — we&apos;ll be in touch to confirm.</p>
          </div>
        ) : formState === "idle" ? (
          <button
            onClick={() => setFormState("open")}
            className="inline-flex h-9 items-center justify-center border border-fg px-md font-mono text-[0.75rem] uppercase tracking-[0.12em] text-fg transition-colors hover:bg-fg hover:text-canvas"
          >
            Order
          </button>
        ) : (
          <form onSubmit={handleOrder} className="grid gap-sm border-t border-border pt-sm">
            <div className="flex items-center gap-sm">
              <span className={labelBase}>Qty</span>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border-b border-input bg-transparent py-1 font-mono text-sm text-fg focus:border-fg focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-xs">
              <label className={labelBase}>Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputBase}
                placeholder="Your name"
              />
            </div>

            <div className="grid gap-xs">
              <label className={labelBase}>Phone</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputBase}
                placeholder="+961 76 000 000"
              />
            </div>

            <div className="grid gap-xs">
              <label className={labelBase}>Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputBase}
                placeholder="your@email.com"
              />
            </div>

            {(formState === "error") && errorMsg && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-warning">{errorMsg}</p>
            )}

            <div className="flex gap-sm">
              <button
                type="submit"
                disabled={formState === "submitting"}
                className="inline-flex h-9 items-center justify-center px-md font-mono text-[0.75rem] uppercase tracking-[0.12em] transition-opacity disabled:opacity-50 hover:opacity-80"
                style={{ background: "var(--accent)", color: "var(--canvas)" }}
              >
                {formState === "submitting" ? "Sending…" : `Place order · ${formatPrice(product.price_cents * quantity)}`}
              </button>
              <button
                type="button"
                onClick={() => { setFormState("idle"); setErrorMsg(null); }}
                className="inline-flex h-9 items-center justify-center border border-border px-md font-mono text-[0.75rem] uppercase tracking-[0.12em] text-muted-fg transition-colors hover:border-fg hover:text-fg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export function ProductsSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
        <div className="mb-xl grid gap-sm">
          <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
            Shop
          </p>
          <h2
            className="font-display uppercase text-fg"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
              lineHeight: 1.04,
              letterSpacing: "0.05em",
              maxWidth: "14ch",
            }}
          >
            Our product range
          </h2>
          <p className="text-muted-fg" style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8, maxWidth: "44ch" }}>
            Professional-grade products used and sold in our salons. Order below and collect at your next visit.
          </p>
        </div>

        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
