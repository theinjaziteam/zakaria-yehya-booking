"use client";

import { useCart } from "@/components/cart-provider";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.product_id === product.id);

  return (
    <article className="border border-border bg-card">
      {product.image_url && (
        <div className="overflow-hidden" style={{ height: "200px" }}>
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-md grid gap-xs">
        <div className="flex items-start justify-between gap-sm">
          <h3
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)" }}
          >
            {product.name}
          </h3>
          <p className="shrink-0 font-mono text-fg" style={{ fontSize: "var(--title-sm-size)" }}>
            {fmt(product.price_cents)}
          </p>
        </div>

        {product.description && (
          <p className="text-muted-fg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.65 }}>
            {product.description}
          </p>
        )}

        <button
          onClick={() => addItem(product)}
          className="mt-xs inline-flex h-9 items-center justify-center border px-md font-mono text-[0.75rem] uppercase tracking-[0.12em] transition-colors"
          style={inCart
            ? { borderColor: "var(--accent)", color: "var(--accent)" }
            : { borderColor: "var(--fg)", color: "var(--fg)" }
          }
          onMouseEnter={e => { if (!inCart) { (e.currentTarget as HTMLButtonElement).style.background = "var(--fg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--canvas)"; }}}
          onMouseLeave={e => { if (!inCart) { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)"; }}}
        >
          {inCart ? "Added ✓" : "Add to cart"}
        </button>
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
            style={{ fontSize: "clamp(1.75rem, 5vw, 3.25rem)", lineHeight: 1.04, letterSpacing: "0.05em", maxWidth: "14ch" }}
          >
            Our product range
          </h2>
          <p className="text-muted-fg" style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8, maxWidth: "44ch" }}>
            Professional-grade products used and sold in our salons. Add to cart and complete your order in one go.
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
