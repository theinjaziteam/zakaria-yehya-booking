"use client";

import Link from "next/link";
import { useState } from "react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { useCart } from "@/components/cart-provider";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

// Legacy: used by booking confirm-form to clear add-on products from localStorage
export function clearPendingProducts() {
  try { localStorage.removeItem("yz_pending_products"); } catch { /* ignore */ }
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(28,23,20,0.10)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image — edge to edge, 3:4 */}
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", flexShrink: 0 }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.6s ease" }}
            className="group-hover:scale-105"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#F2EDE6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.3)" }}>—</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Name + price */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)", textTransform: "uppercase", color: "#1C1714", lineHeight: 1.2, margin: 0 }}>
            {product.name}
          </h3>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)", letterSpacing: "0.06em", color: "rgba(28,23,20,0.55)", flexShrink: 0 }}>
            {fmt(product.price_cents)}
          </p>
        </div>

        {/* Description */}
        {product.description && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)", lineHeight: 1.6, color: "rgba(28,23,20,0.55)", margin: 0 }}>
            {product.description}
          </p>
        )}

        {/* Spacer pushes button to bottom */}
        <div style={{ flex: 1 }} />

        {/* Add to cart — outlined, accent color, clearly different from the checkout CTA */}
        <button
          onClick={handleAdd}
          style={{
            marginTop: 4,
            padding: "9px 0",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            border: added ? "1px solid #3E6E34" : "1px solid rgba(28,23,20,0.35)",
            background: added ? "#3E6E34" : "transparent",
            color: added ? "#F9F6F1" : "#1C1714",
            cursor: "pointer",
            transition: "all 0.2s ease",
            width: "100%",
          }}
        >
          {added ? "Added ✓" : "+ Add to cart"}
        </button>
      </div>
    </article>
  );
}

export function ProductsSection({ products }: { products: Product[] }) {
  const { itemCount, totalCents } = useCart();

  if (products.length === 0) return null;

  return (
    <section id="shop" className="border-b border-border">
      <div
        className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section"
        style={{ background: "#C4B5A0" }}
      >
        {/* Header */}
        <div className="mb-xl grid gap-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-sm">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.5)" }}>
              The shelf
            </p>
            <h2
              className="font-display uppercase"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "0.05em", maxWidth: "14ch", color: "#1C1714" }}
            >
              What we carry.
            </h2>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)", lineHeight: 1.7, color: "rgba(28,23,20,0.6)", maxWidth: "34ch" }}>
            Add products to your cart and choose a pickup time at the salon.
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-md sm:grid-cols-2 lg:grid-cols-4 lg:gap-lg">
          {products.map((p, i) => (
            <ScrollReveal key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </ScrollReveal>
          ))}
        </div>

        {/* Checkout CTA — only when cart has items. Visually distinct: dark fill, pill, separated by space */}
        {itemCount > 0 && (
          <div
            style={{
              marginTop: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              borderTop: "1px solid rgba(28,23,20,0.2)",
              paddingTop: "1.5rem",
            }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.6)" }}>
              {itemCount} {itemCount === 1 ? "item" : "items"} · {fmt(totalCents)}
            </p>
            <Link
              href="/checkout"
              style={{
                display: "inline-flex",
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                padding: "0 2rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderRadius: 9999,
                background: "#1C1714",
                color: "#F9F6F1",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
            >
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
