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
      {/* Image */}
      <div
        className="group"
        style={{ aspectRatio: "3/4", overflow: "hidden", marginBottom: "1rem" }}
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
          <div style={{ width: "100%", height: "100%", background: "rgba(249,246,241,0.06)" }} />
        )}
      </div>

      {/* Name + price */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <h3 style={{
          fontFamily: "var(--font-display)", fontSize: "var(--title-sm-size)",
          letterSpacing: "var(--title-sm-tracking)", textTransform: "uppercase",
          color: "#F9F6F1", lineHeight: 1.2, margin: 0,
        }}>
          {product.name}
        </h3>
        <p style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)",
          letterSpacing: "0.08em", color: "rgba(249,246,241,0.45)", flexShrink: 0,
        }}>
          {fmt(product.price_cents)}
        </p>
      </div>

      {/* Description */}
      {product.description && (
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)",
          lineHeight: 1.55, color: "rgba(249,246,241,0.45)", margin: "0 0 14px",
        }}>
          {product.description}
        </p>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        style={{
          marginTop: "auto",
          padding: "9px 0",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          border: added
            ? "1px solid #3E6E34"
            : "1px solid rgba(249,246,241,0.22)",
          background: added ? "#3E6E34" : "transparent",
          color: added ? "#F9F6F1" : "rgba(249,246,241,0.65)",
          cursor: "pointer",
          transition: "all 0.2s ease",
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
    <section
      id="shop"
      style={{
        background: "#1C1714",
        borderBottom: "1px solid rgba(249,246,241,0.08)",
      }}
    >
      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">

        {/* Header */}
        <div className="mb-xl grid gap-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-sm">
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: "var(--caption-size)",
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(249,246,241,0.45)",
            }}>
              The shelf
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
              lineHeight: 1.04, letterSpacing: "0.05em", textTransform: "uppercase",
              color: "#F9F6F1", maxWidth: "14ch", margin: 0,
            }}>
              What we carry.
            </h2>
          </div>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: "var(--body-sm-size)",
            lineHeight: 1.7, color: "rgba(249,246,241,0.45)", maxWidth: "34ch",
          }}>
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
          <div style={{
            marginTop: "3rem",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem",
            borderTop: "1px solid rgba(249,246,241,0.12)", paddingTop: "1.5rem",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: "0.8125rem",
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(249,246,241,0.45)",
            }}>
              {itemCount} {itemCount === 1 ? "item" : "items"} · {fmt(totalCents)}
            </p>
            <Link href="/checkout" style={{
              display: "inline-flex", height: 44, alignItems: "center", justifyContent: "center",
              padding: "0 2rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 9999,
              background: "#F9F6F1", color: "#1C1714",
              textDecoration: "none", transition: "opacity 0.2s",
            }}>
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
