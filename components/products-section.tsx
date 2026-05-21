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

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="group">
      {/* Portrait image — 3:4 */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-secondary flex items-center justify-center">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg">—</span>
          </div>
        )}
      </div>

      {/* Label + Add button */}
      <div className="mt-sm grid gap-xs">
        <div className="flex items-baseline justify-between gap-sm">
          <h3
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)", lineHeight: 1.2 }}
          >
            {product.name}
          </h3>
          <p
            className="shrink-0 font-mono text-muted-fg"
            style={{ fontSize: "var(--caption-size)", letterSpacing: "0.06em" }}
          >
            {fmt(product.price_cents)}
          </p>
        </div>
        {product.description && (
          <p className="text-muted-fg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.55 }}>
            {product.description}
          </p>
        )}
        <button
          onClick={handleAdd}
          className="mt-xs w-full border border-fg py-2 font-mono text-[0.7rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
          style={added ? { background: "var(--fg)", color: "var(--canvas)" } : {}}
        >
          {added ? "Added ✓" : "Add to cart"}
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
      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">

        {/* Header */}
        <div className="mb-xl grid gap-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-sm">
            <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              The shelf
            </p>
            <h2
              className="font-display uppercase text-fg"
              style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "0.05em", maxWidth: "14ch" }}
            >
              What we carry.
            </h2>
          </div>
          <p
            className="text-muted-fg lg:text-right lg:max-w-[34ch]"
            style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}
          >
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

        {/* Checkout CTA — only visible when cart has items */}
        {itemCount > 0 && (
          <div className="mt-xl flex items-center justify-between gap-md border-t border-fg pt-md">
            <p className="font-mono text-sm uppercase tracking-widest text-fg">
              {itemCount} {itemCount === 1 ? "item" : "items"} · {fmt(totalCents)}
            </p>
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center border border-fg px-8 font-mono text-sm uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              Checkout →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
