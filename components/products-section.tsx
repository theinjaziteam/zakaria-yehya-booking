"use client";

import { useRouter } from "next/navigation";
import { ScrollReveal } from "@/components/scroll-reveal";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

export type PendingProduct = {
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
};

const PENDING_KEY = "yz_pending_products";

export function savePendingProduct(p: Product) {
  try {
    const existing: PendingProduct[] = JSON.parse(
      localStorage.getItem(PENDING_KEY) ?? "[]",
    );
    const idx = existing.findIndex((x) => x.product_id === p.id);
    if (idx >= 0) {
      existing[idx]!.quantity += 1;
    } else {
      existing.push({ product_id: p.id, product_name: p.name, unit_price_cents: p.price_cents, quantity: 1 });
    }
    localStorage.setItem(PENDING_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

export function loadPendingProducts(): PendingProduct[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]"); }
  catch { return []; }
}

export function clearPendingProducts() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  function handleClick() {
    savePendingProduct(product);
    router.push("/book");
  }

  return (
    <article
      className="group cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Add ${product.name} to your booking`}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
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
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-end p-md transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{ background: "linear-gradient(to top, rgba(28,23,20,0.72) 0%, transparent 55%)" }}
        >
          <span
            className="font-mono uppercase text-white"
            style={{ fontSize: "var(--caption-size)", letterSpacing: "0.16em" }}
          >
            Add to booking →
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-sm grid gap-xxs">
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
          <p
            className="text-muted-fg"
            style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.55 }}
          >
            {product.description}
          </p>
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
            Tap any product to add it to your booking — it will be waiting at the salon on the day.
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
      </div>
    </section>
  );
}
