import Link from "next/link";
import { clientConfig } from "@/config/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductsSection, type Product } from "@/components/products-section";
import { CelebGrid } from "@/components/celeb-grid";
import { NavActions } from "@/components/nav-actions";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HeroVideo } from "@/components/hero-video";

type LandingLocation = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string | null;
  timezone: string;
};

type LandingServiceCategory = {
  id: string;
  name: string;
  sort_order: number;
};

type LandingService = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  requires_consultation: boolean;
};

type LandingData = {
  locations: LandingLocation[];
  categories: LandingServiceCategory[];
  services: LandingService[];
  connected: boolean;
};

// Curated Unsplash images — luxury salon / editorial hair photography
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=2400&q=85&auto=format&fit=crop";
const INTERIOR_IMAGE =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1800&q=85&auto=format&fit=crop";
const CRAFT_IMAGE =
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1800&q=85&auto=format&fit=crop";
const CTA_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1400&q=85&auto=format&fit=crop";

function formatPrice(priceCents: number) {
  const amount = priceCents / 100;
  return `${clientConfig.business.currencySymbol}${amount.toFixed(0)}`;
}

function formatDuration(durationMin: number) {
  if (durationMin >= 60) {
    const h = Math.floor(durationMin / 60);
    const m = durationMin % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${durationMin} min`;
}

function sortLocations(locations: LandingLocation[]) {
  const order = new Map(
    clientConfig.presentation.locationOrder.map((slug, index) => [slug, index]),
  );
  return [...locations].sort((a, b) => {
    const ao = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bo = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    return ao !== bo ? ao - bo : a.name.localeCompare(b.name);
  });
}

async function getLandingData(): Promise<LandingData> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { locations: [], categories: [], services: [], connected: false };
  }
  try {
    const supabase = await createServerSupabaseClient();
    const [locationsResult, categoriesResult, servicesResult] =
      await Promise.all([
        supabase
          .from("locations")
          .select("id, slug, name, address, phone, timezone")
          .eq("active", true)
          .returns<LandingLocation[]>(),
        supabase
          .from("service_categories")
          .select("id, name, sort_order")
          .order("sort_order", { ascending: true })
          .returns<LandingServiceCategory[]>(),
        supabase
          .from("services")
          .select(
            "id, category_id, name, slug, duration_min, price_cents, description, requires_consultation",
          )
          .eq("active", true)
          .order("sort_order", { ascending: true })
          .returns<LandingService[]>(),
      ]);

    if (locationsResult.error || categoriesResult.error || servicesResult.error) {
      return { locations: [], categories: [], services: [], connected: true };
    }

    return {
      locations: sortLocations(locationsResult.data ?? []),
      categories: categoriesResult.data ?? [],
      services: servicesResult.data ?? [],
      connected: true,
    };
  } catch {
    return { locations: [], categories: [], services: [], connected: true };
  }
}

// Fallback service menu for demo (no DB connected)
const DEMO_CATEGORIES = [
  { id: "c1", name: "Cut & Style", sort_order: 1 },
  { id: "c2", name: "Colour", sort_order: 2 },
  { id: "c3", name: "Treatments", sort_order: 3 },
  { id: "c4", name: "Bridal", sort_order: 4 },
  { id: "c5", name: "Gentleman's Grooming", sort_order: 5 },
];

const DEMO_SERVICES = [
  { id: "s1", category_id: "c1", name: "Haircut & Style — Ladies", slug: "cut-ladies", duration_min: 60, price_cents: 4500, description: null, requires_consultation: false },
  { id: "s2", category_id: "c1", name: "Haircut & Style — Men", slug: "cut-men", duration_min: 45, price_cents: 3000, description: null, requires_consultation: false },
  { id: "s3", category_id: "c1", name: "Blow-Dry & Styling", slug: "blowdry", duration_min: 45, price_cents: 3500, description: null, requires_consultation: false },
  { id: "s4", category_id: "c1", name: "Children's Cut", slug: "cut-children", duration_min: 30, price_cents: 2000, description: "Under 12", requires_consultation: false },
  { id: "s5", category_id: "c2", name: "Single Process Colour", slug: "colour-single", duration_min: 120, price_cents: 9000, description: null, requires_consultation: false },
  { id: "s6", category_id: "c2", name: "Highlights & Balayage", slug: "balayage", duration_min: 180, price_cents: 18000, description: null, requires_consultation: false },
  { id: "s7", category_id: "c2", name: "Colour Correction", slug: "colour-correction", duration_min: 240, price_cents: 25000, description: null, requires_consultation: true },
  { id: "s8", category_id: "c3", name: "Keratin Treatment", slug: "keratin", duration_min: 180, price_cents: 20000, description: null, requires_consultation: false },
  { id: "s9", category_id: "c3", name: "Hair Botox", slug: "hair-botox", duration_min: 150, price_cents: 15000, description: null, requires_consultation: false },
  { id: "s10", category_id: "c4", name: "Bridal Hair — Trial", slug: "bridal-trial", duration_min: 90, price_cents: 12000, description: null, requires_consultation: false },
  { id: "s11", category_id: "c4", name: "Bridal Hair — Day Of", slug: "bridal-day", duration_min: 120, price_cents: 25000, description: null, requires_consultation: false },
  { id: "s12", category_id: "c5", name: "Beard Trim & Shape", slug: "beard", duration_min: 30, price_cents: 2000, description: null, requires_consultation: false },
  { id: "s13", category_id: "c5", name: "Traditional Hot Shave", slug: "hot-shave", duration_min: 45, price_cents: 3000, description: null, requires_consultation: false },
];

const DEMO_LOCATIONS = [
  { id: "l1", slug: "verdun", name: "Verdun", address: "Rashid Karameh Street, Shad Building, Verdun, Beirut", phone: "+961 1 XXX XXX", timezone: "Asia/Beirut" },
  { id: "l2", slug: "achrafieh", name: "Achrafieh", address: "Rue Sursock, Achrafieh, Beirut", phone: "+961 1 XXX XXX", timezone: "Asia/Beirut" },
  { id: "l3", slug: "kaslik", name: "Kaslik", address: "Main Road, Kaslik, Jounieh", phone: "+961 9 XXX XXX", timezone: "Asia/Beirut" },
];

const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Argan Oil Elixir", description: "Deep-conditioning Moroccan argan oil treatment. Repairs, strengthens, and adds luminous shine.", price_cents: 4500, image_url: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&q=80&auto=format&fit=crop" },
  { id: "p2", name: "Scalp Revival Serum", description: "Purifying serum that balances and nourishes the scalp. Strengthens roots from the source.", price_cents: 3800, image_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&auto=format&fit=crop" },
  { id: "p3", name: "Colour-Lock Conditioner", description: "Colour-preserving conditioner that seals the cuticle and extends the life of your colour treatment.", price_cents: 3200, image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80&auto=format&fit=crop" },
  { id: "p4", name: "Styling Clay", description: "Medium-hold, matte-finish clay. Buildable texture with a clean, natural-looking result.", price_cents: 2800, image_url: "https://images.unsplash.com/photo-1590156562745-5d51c4e69e41?w=800&q=80&auto=format&fit=crop" },
];

async function getProducts(): Promise<Product[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return DEMO_PRODUCTS;
  }
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("products")
      .select("id, name, description, price_cents, image_url")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .returns<Product[]>();
    return data && data.length > 0 ? data : DEMO_PRODUCTS;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export default async function PublicHomePage() {
  const [rawData, products] = await Promise.all([getLandingData(), getProducts()]);

  const locations =
    rawData.locations.length > 0 ? rawData.locations : DEMO_LOCATIONS;
  const categories =
    rawData.categories.length > 0 ? rawData.categories : DEMO_CATEGORIES;
  const services =
    rawData.services.length > 0 ? rawData.services : DEMO_SERVICES;

  return (
    <main id="top" className="bg-bg text-body">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b border-border bg-bg/95"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-md sm:px-xl">
          {/* Left: short name */}
          <a
            href="#top"
            className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg shrink-0"
          >
            {clientConfig.brand.shortName}
          </a>

          {/* Center wordmark — hidden on mobile where it crowds the nav */}
          <p className="hidden sm:block font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
            {clientConfig.brand.name}
          </p>

          {/* Right: cart + my bookings + auth */}
          <NavActions />
        </div>
      </nav>

      {/* ── HERO — full-bleed video band ────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ height: "clamp(560px, 72vh, 820px)" }}
      >
        {/* Hero video — client component handles autoplay + suppresses mobile play button */}
        <HeroVideo
          src="https://assets.mixkit.co/videos/preview/mixkit-hairdresser-blow-drying-a-womans-hair-in-a-salon-49556-large.mp4"
          poster={HERO_IMAGE}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        {/* Content */}
        <div
          className="absolute inset-0 flex flex-col justify-end px-md sm:px-xl"
          style={{ color: "#F9F6F1", paddingBottom: "clamp(1.75rem, 6vh, 4.5rem)" }}
        >
          <div className="mx-auto w-full max-w-7xl">
            <p
              className="hero-eyebrow mb-4 font-mono uppercase"
              style={{ fontSize: "0.8125rem", letterSpacing: "0.18em", opacity: 0.65 }}
            >
              {clientConfig.copy.hero.eyebrow}
            </p>
            <h1
              className="hero-h1 mb-6 font-display uppercase"
              style={{
                fontSize: "clamp(2.5rem, 7.5vw, 6.5rem)",
                lineHeight: 0.95,
                letterSpacing: "0.03em",
                maxWidth: "14ch",
              }}
            >
              {clientConfig.copy.hero.title}
            </h1>
            <p
              className="hero-body mb-8"
              style={{
                fontSize: "clamp(0.9375rem, 1.5vw, 1.125rem)",
                lineHeight: 1.78,
                maxWidth: "44ch",
                color: "rgba(249,246,241,0.80)",
              }}
            >
              {clientConfig.copy.hero.body}
            </p>
            <div className="hero-cta flex flex-wrap items-center gap-md">
              <Link
                href="/book"
                className="inline-flex h-14 items-center justify-center px-10 font-mono uppercase tracking-widest transition-opacity hover:opacity-85"
                style={{
                  borderRadius: "var(--radius-pill)",
                  background: "#F9F6F1",
                  color: "#1C1714",
                  fontSize: "1rem",
                  letterSpacing: "0.15em",
                  fontWeight: 600,
                }}
              >
                {clientConfig.copy.hero.primaryCtaLabel}
              </Link>
              <a
                href="#services"
                className="font-mono uppercase transition-opacity hover:opacity-100"
                style={{ fontSize: "0.8125rem", letterSpacing: "0.14em", color: "rgba(249,246,241,0.65)" }}
              >
                View services ↓
              </a>
            </div>
          </div>
        </div>

        {/* Instagram icon — top-right corner */}
        <a
          href="https://www.instagram.com/yehiaandzakaria/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="absolute right-md top-5 sm:right-xl sm:top-6 text-white transition-opacity hover:opacity-70"
          style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4.5"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
        </a>
      </section>

      {/* ── MARQUEE TICKER ──────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-border bg-card py-3">
        <div
          className="flex gap-xl whitespace-nowrap font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg"
          style={{ animation: "marquee 14s linear infinite" }}
        >
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex shrink-0 gap-xl">
              <span>Est. 1998</span>
              <span className="text-border">·</span>
              <span>Verdun · Achrafieh · Kaslik</span>
              <span className="text-border">·</span>
              <span>By appointment only</span>
              <span className="text-border">·</span>
              <span>Celebrity Hairstylists — Beirut</span>
              <span className="text-border">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PHILOSOPHY ──────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-xxl lg:items-center">
            {/* Photo */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
              <img
                src={INTERIOR_IMAGE}
                alt="Inside the salon — mirrors, chairs, quiet craft"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            {/* Text */}
            <div className="grid gap-md">
              <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                {clientConfig.copy.philosophy.eyebrow}
              </p>
              <h2
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
                  lineHeight: 1.04,
                  letterSpacing: "0.05em",
                  maxWidth: "13ch",
                }}
              >
                {clientConfig.copy.philosophy.title}
              </h2>
              <div className="grid gap-sm">
                {clientConfig.copy.philosophy.paragraphs.map((p) => (
                  <p
                    key={p}
                    className="text-body"
                    style={{
                      fontSize: "var(--body-md-size)",
                      lineHeight: 1.8,
                      maxWidth: "42ch",
                    }}
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Heritage stats */}
              <div className="mt-sm grid grid-cols-3 gap-xs border-t border-border pt-md">
                {[
                  { value: "1998", label: "Founded" },
                  { value: "25+", label: "Years in Beirut" },
                  { value: "3", label: "Addresses" },
                ].map((stat) => (
                  <div key={stat.label} className="grid gap-xxs">
                    <p
                      className="font-display uppercase text-fg"
                      style={{
                        fontSize: "var(--display-sm-size)",
                        letterSpacing: "var(--display-sm-tracking)",
                      }}
                    >
                      {stat.value}
                    </p>
                    <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED CRAFT BAND ───────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border" style={{ height: "55vh", minHeight: "340px" }}>
        <img
          src={CRAFT_IMAGE}
          alt="The precision of the craft — hands at work"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.54)" }}
        />
        <div className="absolute inset-0 flex items-center px-md sm:px-xl">
          <div className="mx-auto w-full max-w-7xl">
            <p
              className="font-display uppercase"
              style={{
                fontSize: "clamp(1.5rem, 4.5vw, 3rem)",
                lineHeight: 1.08,
                letterSpacing: "0.05em",
                maxWidth: "20ch",
                color: "#F9F6F1",
              }}
            >
              "Hair considered in daylight, in evening rooms, and under the flash of a camera."
            </p>
          </div>
        </div>
      </section>

      {/* ── AS SEEN AT ──────────────────────────────────────────────── */}
      <section className="border-b border-border" style={{ background: "#EDE8E2" }}>
        <ScrollReveal className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="mb-xl grid gap-sm">
            <p
              className="font-mono uppercase text-muted-fg"
              style={{ fontSize: "var(--caption-size)", letterSpacing: "var(--caption-tracking)" }}
            >
              As seen at Yehïa & Zakarïa
            </p>
            <h2
              className="font-display uppercase text-fg"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "0.05em" }}
            >
              Where icons come to be seen.
            </h2>
            <p style={{ fontSize: "var(--body-sm-size)", color: "var(--body)", maxWidth: "52ch", lineHeight: 1.7 }}>
              For over two decades, the Arab world's most celebrated names have trusted Yehïa & Zakarïa with their signature look — from album covers to red carpet appearances.
            </p>
          </div>

          {/* CelebGrid is a client component — handles click-to-reveal on touch */}
          <CelebGrid />
        </ScrollReveal>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────── */}
      <section id="services" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          {/* Section header */}
          <div className="mb-xl grid gap-sm lg:mb-xxl lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:items-end lg:gap-xl">
            <div>
              <p className="mb-sm font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                {clientConfig.copy.services.eyebrow}
              </p>
              <h2
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
                  lineHeight: 1.04,
                  letterSpacing: "0.05em",
                  maxWidth: "12ch",
                }}
              >
                {clientConfig.copy.services.title}
              </h2>
            </div>
            <p
              className="text-body lg:max-w-[44ch]"
              style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8 }}
            >
              {clientConfig.copy.services.intro}
            </p>
          </div>

          {/* Service list */}
          <div className="grid gap-xl">
            {categories.map((category) => {
              const cat_services = services.filter(
                (s) => s.category_id === category.id,
              );
              if (cat_services.length === 0) return null;

              return (
                <div key={category.id}>
                  <p className="mb-sm border-b border-border pb-xs font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                    {category.name}
                  </p>
                  <div className="grid gap-0">
                    {cat_services.map((service, i) => (
                      <article
                        key={service.id}
                        className={`grid grid-cols-[1fr_auto] items-center gap-md py-md ${
                          i < cat_services.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <div className="min-w-0 grid gap-xxs">
                          <div className="flex flex-wrap items-center gap-xs">
                            <h3
                              className="font-display uppercase text-fg"
                              style={{
                                fontSize: "var(--title-md-size)",
                                letterSpacing: "var(--title-md-tracking)",
                              }}
                            >
                              {service.name}
                            </h3>
                            {service.requires_consultation && (
                              <span className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                                {clientConfig.copy.services.consultationLabel}
                              </span>
                            )}
                          </div>
                          {service.description && (
                            <p
                              className="text-muted-fg"
                              style={{ fontSize: "var(--body-sm-size)" }}
                            >
                              {service.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-md">
                          <div className="hidden text-right sm:block">
                            <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg">
                              {formatDuration(service.duration_min)}
                            </p>
                            <p
                              className="font-mono text-fg"
                              style={{ fontSize: "var(--title-sm-size)", letterSpacing: "var(--title-sm-tracking)" }}
                            >
                              {formatPrice(service.price_cents)}
                            </p>
                          </div>
                          <Link
                            href={`/book`}
                            className="shrink-0 inline-flex h-9 items-center justify-center border border-border px-4 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-fg transition-colors hover:border-fg"
                          >
                            Book
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-xl border-t border-border pt-md">
            <Link
              href="/book"
              className="inline-flex h-11 items-center justify-center border border-fg px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-opacity hover:opacity-70"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              Reserve your chair
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ────────────────────────────────────────────────── */}
      {/* Warm amber band — signals "shop" without leaving the brand palette */}
      <div style={{ background: "#EDE4D5", borderBottom: "1px solid var(--hairline)" }}>
        <ProductsSection products={products} />
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      {/* Full dark-ink section — creates the strongest visual break on the page */}
      <section
        className="border-b"
        style={{
          background: "#1C1714",
          borderColor: "rgba(249,246,241,0.08)",
          // Override CSS tokens so all child classes (text-fg, border-border etc.) invert
          ["--fg" as string]: "#F9F6F1",
          ["--body" as string]: "rgba(249,246,241,0.82)",
          ["--muted-fg" as string]: "rgba(249,246,241,0.55)",
          ["--border" as string]: "rgba(249,246,241,0.14)",
        }}
      >
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="mb-xl grid gap-sm">
            <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              {clientConfig.copy.howItWorks.eyebrow}
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
              {clientConfig.copy.howItWorks.title}
            </h2>
          </div>

          <div className="grid gap-0">
            {[
              ...clientConfig.copy.howItWorks.steps,
              {
                title: "Keep the reference",
                body: "A reservation code is issued on confirmation — use it to look up, cancel, or modify the booking at any time.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="grid grid-cols-[3rem_1fr] gap-md border-t border-border py-md sm:grid-cols-[4rem_1fr_1fr] sm:items-start"
              >
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg pt-xxs">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3
                  className="font-display uppercase text-fg"
                  style={{
                    fontSize: "var(--title-md-size)",
                    letterSpacing: "var(--title-md-tracking)",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="col-start-2 text-body sm:col-start-3"
                  style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}
                >
                  {step.body}
                </p>
              </div>
            ))}
            <div className="border-t border-border" />
          </div>

          <div className="mt-xl">
            <Link
              href="/book"
              className="inline-flex h-11 items-center justify-center border border-fg px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-opacity hover:opacity-70"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              Begin reservation
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="grid gap-xl lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-xxl lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="mb-sm font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                {clientConfig.copy.faq.eyebrow}
              </p>
              <h2
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
                  lineHeight: 1.04,
                  letterSpacing: "0.05em",
                  maxWidth: "12ch",
                }}
              >
                {clientConfig.copy.faq.title}
              </h2>
            </div>

            <div className="grid gap-0">
              {clientConfig.copy.faq.items.map((item, i) => (
                <article
                  key={item.question}
                  className={`grid gap-xs py-md ${
                    i < clientConfig.copy.faq.items.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <h3
                    className="font-display uppercase text-fg"
                    style={{
                      fontSize: "var(--title-md-size)",
                      letterSpacing: "var(--title-md-tracking)",
                    }}
                  >
                    {item.question}
                  </h3>
                  <p
                    className="text-body"
                    style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7, maxWidth: "56ch" }}
                  >
                    {item.answer}
                  </p>
                </article>
              ))}
              <div className="border-t border-border" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="grid lg:grid-cols-2" style={{ minHeight: "clamp(500px, 65vh, 780px)" }}>

          {/* Photo — left half */}
          <div className="relative overflow-hidden" style={{ minHeight: "clamp(280px, 40vh, 500px)" }}>
            <img
              src={CTA_IMAGE}
              alt="Ready — the salon, the chair, the craft"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>

          {/* Text — right half */}
          <div
            className="flex flex-col justify-center gap-lg px-md py-xl sm:px-xl lg:px-xxl"
            style={{ background: "var(--ink)" }}
          >
            <div className="grid gap-md">
              <p
                className="font-mono uppercase"
                style={{ fontSize: "var(--caption-size)", letterSpacing: "0.18em", color: "rgba(249,246,241,0.45)" }}
              >
                Reserve
              </p>
              <h2
                className="font-display uppercase"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  lineHeight: 1.0,
                  letterSpacing: "0.05em",
                  maxWidth: "14ch",
                  color: "#F9F6F1",
                }}
              >
                The chair is ready when you are.
              </h2>
              <p
                style={{
                  fontSize: "var(--body-md-size)",
                  lineHeight: 1.8,
                  maxWidth: "40ch",
                  color: "rgba(249,246,241,0.65)",
                }}
              >
                Walk-ins are welcomed when the schedule allows. A reservation keeps the hour, the stylist, and the service in order before you arrive — and is always the wiser approach.
              </p>
            </div>

            <Link
              href="/book"
              className="self-start inline-flex h-12 items-center justify-center px-8 font-mono uppercase transition-opacity hover:opacity-85"
              style={{
                borderRadius: "var(--radius-pill)",
                background: "#F9F6F1",
                color: "#1C1714",
                fontSize: "var(--button-size)",
                letterSpacing: "var(--button-tracking)",
              }}
            >
              Reserve your chair
            </Link>
          </div>

        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bg-bg">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl">
          <div className="grid gap-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-xxl">
            <div className="grid gap-sm">
              <p
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "var(--wordmark-size)",
                  letterSpacing: "var(--wordmark-tracking)",
                }}
              >
                {clientConfig.brand.name}
              </p>
              <p
                className="text-muted-fg"
                style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7, maxWidth: "44ch" }}
              >
                {clientConfig.copy.footerNote}
              </p>
            </div>

            <div className="grid gap-md sm:grid-cols-2">
              <div className="grid gap-xxs content-start">
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg mb-xs">
                  Contact
                </p>
                <a
                  href={`mailto:${clientConfig.contact.email}`}
                  className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg transition-opacity hover:opacity-70"
                >
                  {clientConfig.contact.email}
                </a>
                <a
                  href="tel:011780710"
                  className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg transition-opacity hover:opacity-70"
                >
                  {clientConfig.contact.supportPhone}
                </a>
                <a
                  href="https://www.instagram.com/yehiaandzakaria/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-xs text-fg transition-opacity hover:opacity-70"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4.5"/>
                    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
                  </svg>
                  <span className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)]">
                    {clientConfig.contact.instagram}
                  </span>
                </a>
              </div>

              <div className="grid gap-xxs content-start">
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg mb-xs">
                  Salons
                </p>
                {locations.map((loc) => (
                  <p
                    key={loc.id}
                    className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg"
                  >
                    {loc.name}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-xl flex flex-wrap items-center justify-between gap-sm border-t border-border pt-md">
            <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              © {new Date().getFullYear()} {clientConfig.brand.name}. All rights reserved.
            </p>
            <Link
              href="/book"
              className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-fg transition-opacity hover:opacity-70"
            >
              Reserve →
            </Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
