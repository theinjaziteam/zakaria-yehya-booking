import Link from "next/link";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

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
            Professional-grade products used in our salons. Add them to your booking when you reserve your appointment.
          </p>
        </div>

        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article key={p.id} className="border border-border bg-card">
              {p.image_url && (
                <div className="overflow-hidden" style={{ height: "200px" }}>
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="p-md grid gap-xs">
                <div className="flex items-start justify-between gap-sm">
                  <h3
                    className="font-display uppercase text-fg"
                    style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)" }}
                  >
                    {p.name}
                  </h3>
                  <p className="shrink-0 font-mono text-fg" style={{ fontSize: "var(--title-sm-size)" }}>
                    {fmt(p.price_cents)}
                  </p>
                </div>
                {p.description && (
                  <p className="text-muted-fg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.65 }}>
                    {p.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-xl">
          <Link
            href="/book"
            className="inline-flex h-10 items-center justify-center border border-fg px-6 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-colors hover:bg-fg hover:text-canvas"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            Book & add products →
          </Link>
        </div>
      </div>
    </section>
  );
}
