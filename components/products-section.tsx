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

export function clearPendingProducts() {
  try { localStorage.removeItem("yz_pending_products"); } catch { /* ignore */ }
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

const SECTION_BG = "#D9CBBA";
const TEXT_PRIMARY = "#1C1714";
const TEXT_MUTED = "rgba(28,23,20,0.5)";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article style={{ display: "flex", flexDirection: "column" }}>
      {/* Image — edge to edge, no container box */}
      <div
        style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", marginBottom: 12 }}
        className="group"
      >
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
          <div style={{ width: "100%", height: "100%", background: "rgba(28,23,20,0.08)" }} />
        )}
      </div>

      {/* Label row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: "var(--title-sm-size)",
          letterSpacing: "var(--title-sm-tracking)", textTransform: "uppercase",
          color: TEXT_PRIMARY, lineHeight: 1.2, margin: 0,
        }}>
          {product.name}
        </h3>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)", letterSpacing: "0.06em", color: TEXT_MUTED, flexShrink: 0 }}>
          {fmt(product.price_cents)}
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)", lineHeight: 1.55, color: TEXT_MUTED, margin: "0 0 10px" }}>
          {product.description}
        </p>
      )}

      {/* Add button — text-only style, feels editorial */}
      <button
        onClick={handleAdd}
        style={{
          marginTop: "auto",
          padding: "8px 0",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          border: "none",
          borderTop: added ? "1px solid #3E6E34" : `1px solid rgba(28,23,20,0.25)`,
          background: "transparent",
          color: added ? "#3E6E34" : TEXT_MUTED,
          cursor: "pointer",
          transition: "all 0.2s ease",
          textAlign: "left",
          width: "100%",
        }}
      >
        {added ? "Added ✓" : "+ Add to cart"}
      </button>
    </article>
  );
}

export function ProductsSection({ products }: { products: Product[] }) {
  const { itemCount, totalCents } = useCart();

  if (products.length === 0) return null;

  return (
    <section id="shop" style={{ background: SECTION_BG, borderBottom: "1px solid var(--hairline)" }}>
      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">

        {/* Header */}
        <div className="mb-xl grid gap-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-sm">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)", letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_MUTED }}>
              The shelf
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "0.05em", textTransform: "uppercase", color: TEXT_PRIMARY, maxWidth: "14ch", margin: 0 }}>
              What we carry.
            </h2>
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)", lineHeight: 1.7, color: TEXT_MUTED, maxWidth: "34ch" }}>
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

        {/* Checkout CTA */}
        {itemCount > 0 && (
          <div style={{
            marginTop: "3rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem",
            borderTop: "1px solid rgba(28,23,20,0.18)", paddingTop: "1.5rem",
          }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_MUTED }}>
              {itemCount} {itemCount === 1 ? "item" : "items"} · {fmt(totalCents)}
            </p>
            <Link href="/checkout" style={{
              display: "inline-flex", height: 44, alignItems: "center", justifyContent: "center",
              padding: "0 2rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 9999,
              background: TEXT_PRIMARY, color: "#F9F6F1", textDecoration: "none", transition: "opacity 0.2s",
            }}>
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
