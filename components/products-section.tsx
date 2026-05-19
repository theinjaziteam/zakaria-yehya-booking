"use client";

import { useRouter } from "next/navigation";

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
    <article className="border border-border bg-card overflow-hidden">
      {/* Clickable photo */}
      <button
        type="button"
        onClick={handleClick}
        className="block w-full overflow-hidden relative group focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
        style={{ height: 220 }}
        aria-label={`Add ${product.name} to your booking`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-secondary flex items-center justify-center">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-fg">No image</span>
          </div>
        )}
        {/* Overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/30 transition-colors duration-300">
          <span
            className="font-mono text-[0.65rem] uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
            Add to booking →
          </span>
        </div>
      </button>

      {/* Info */}
      <div className="p-4 grid gap-1">
        <div className="flex items-start justify-between gap-2">
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
          <p className="text-muted-fg text-sm leading-relaxed">{product.description}</p>
        )}
        <button
          type="button"
          onClick={handleClick}
          className="mt-2 h-8 w-full border border-fg font-mono text-[0.65rem] uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
        >
          Add to booking
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
            Tap any product to add it to your next booking. It will be waiting for you at the salon on the day.
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
