"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { useCart } from "@/components/cart-provider";
import { clientConfig } from "@/config/client";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

export function clearPendingProducts() {
  try { localStorage.removeItem("yz_pending_products"); } catch { /* ignore */ }
}

function fmt(cents: number) { return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`; }

function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const cartItem = items.find(i => i.product_id === product.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      {/* Image */}
      <div className="group" style={{ aspectRatio: "3/4", overflow: "hidden", marginBottom: "0.875rem" }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
            className="group-hover:scale-[1.04]"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(28,23,20,0.06)" }} />
        )}
      </div>

      {/* Name + price */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: "var(--title-sm-size)",
          letterSpacing: "var(--title-sm-tracking)", textTransform: "uppercase",
          color: "var(--fg)", lineHeight: 1.2, margin: 0,
        }}>
          {product.name}
        </h3>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)", letterSpacing: "0.08em", color: "var(--muted-fg)", flexShrink: 0 }}>
          {fmt(product.price_cents)}
        </p>
      </div>

      {product.description && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)", lineHeight: 1.55, color: "var(--muted-fg)", margin: "0 0 12px" }}>
          {product.description}
        </p>
      )}

      {/* Hairline + action — the style you liked */}
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        {qty === 0 ? (
          <button
            onClick={() => addItem(product)}
            style={{
              width: "100%", background: "transparent", border: "none",
              fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--muted-fg)", cursor: "pointer",
              textAlign: "left", padding: "2px 0", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-fg)")}
          >
            + Add to cart
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Qty controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => qty > 1 ? updateQty(product.id, qty - 1) : removeItem(product.id)}
                style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--muted-fg)", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
              >
                −
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--fg)", minWidth: "1ch", textAlign: "center" }}>
                {qty}
              </span>
              <button
                onClick={() => addItem(product)}
                style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", fontSize: "1rem", color: "var(--muted-fg)", cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
              >
                +
              </button>
            </div>
            {/* Remove */}
            <button
              onClick={() => removeItem(product.id)}
              style={{
                background: "none", border: "none", fontFamily: "var(--font-mono)",
                fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--muted-fg)", cursor: "pointer", padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--warning)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-fg)")}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductsSection({ products }: { products: Product[] }) {
  const { itemCount, totalCents } = useCart();

  if (products.length === 0) return null;

  return (
    <section id="shop" className="border-b border-border" style={{ background: "var(--surface-soft)" }}>
      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">

        {/* Header */}
        <div className="mb-xl grid gap-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-sm">
            <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              The shelf
            </p>
            <h2 className="font-display uppercase text-fg" style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "0.05em", maxWidth: "14ch" }}>
              What we carry.
            </h2>
          </div>
          <p className="text-muted-fg lg:text-right lg:max-w-[34ch]" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}>
            Add products to your cart and arrange a pickup at the salon.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-md sm:grid-cols-2 lg:grid-cols-4 lg:gap-lg">
          {products.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </ScrollReveal>
          ))}
        </div>

        {/* Checkout CTA */}
        {itemCount > 0 && (
          <div className="mt-xl flex items-center justify-between gap-md border-t border-border pt-md">
            <p className="font-mono text-sm uppercase tracking-widest text-muted-fg">
              {itemCount} {itemCount === 1 ? "item" : "items"} · {fmt(totalCents)}
            </p>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center px-8 font-mono text-sm uppercase tracking-widest transition-opacity hover:opacity-85"
              style={{ borderRadius: "var(--radius-pill)", background: "var(--ink)", color: "var(--canvas)" }}
            >
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
