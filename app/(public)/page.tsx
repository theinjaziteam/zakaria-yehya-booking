import Link from "next/link";
import { clientConfig } from "@/config/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export default async function PublicHomePage() {
  const rawData = await getLandingData();

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

          {/* Right: actions */}
          <div className="flex items-center gap-xs sm:gap-md shrink-0">
            <Link
              href="/my-bookings"
              className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg transition-opacity hover:opacity-70"
            >
              My bookings
            </Link>
            <Link
              href="/admin"
              className="hidden lg:inline font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg transition-opacity hover:opacity-70"
            >
              Admin
            </Link>
            <Link
              href="/book"
              className="inline-flex h-9 items-center justify-center border border-fg px-4 sm:px-6 font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg transition-opacity hover:opacity-70"
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              Reserve
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO — full-bleed photo band ────────────────────────────── */}
      <section className="relative h-[65vh] min-h-[480px] overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Salon interior — styling in progress"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Dark gradient overlay — bottom-heavy so type is readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-md pb-[5vh] sm:px-xl">
          <div className="mx-auto w-full max-w-7xl">
            <p
              className="mb-5 font-mono uppercase text-fg"
              style={{ fontSize: "0.8125rem", letterSpacing: "0.18em", opacity: 0.72 }}
            >
              {clientConfig.copy.hero.eyebrow}
            </p>
            <h1
              className="mb-7 font-display uppercase text-fg"
              style={{
                fontSize: "clamp(2.5rem, 7.5vw, 6rem)",
                lineHeight: 0.95,
                letterSpacing: "0.03em",
                maxWidth: "14ch",
              }}
            >
              {clientConfig.copy.hero.title}
            </h1>
            <p
              className="mb-9"
              style={{
                fontSize: "clamp(1rem, 1.6vw, 1.125rem)",
                lineHeight: 1.78,
                maxWidth: "46ch",
                color: "var(--body-strong)",
              }}
            >
              {clientConfig.copy.hero.body}
            </p>
            <div className="flex flex-wrap items-center gap-md">
              <Link
                href="/book"
                className="inline-flex h-14 items-center justify-center px-10 font-mono uppercase tracking-widest transition-opacity hover:opacity-85"
                style={{
                  borderRadius: "var(--radius-pill)",
                  background: "var(--ink)",
                  color: "var(--canvas)",
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
                style={{ fontSize: "0.8125rem", letterSpacing: "0.14em", color: "var(--body-strong)", opacity: 0.8 }}
              >
                View services ↓
              </a>
            </div>
          </div>
        </div>

        {/* Corner caption */}
        <a
          href="https://www.instagram.com/yehiaandzakaria/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-md top-6 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-fg transition-opacity hover:opacity-70 sm:right-xl"
        >
          {clientConfig.contact.instagram}
        </a>
      </section>

      {/* ── MARQUEE TICKER ──────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-border bg-card py-3">
        <div
          className="flex gap-xl whitespace-nowrap font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg"
          style={{ animation: "marquee 28s linear infinite" }}
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
              className="font-display uppercase text-fg"
              style={{
                fontSize: "clamp(1.5rem, 4.5vw, 3rem)",
                lineHeight: 1.08,
                letterSpacing: "0.05em",
                maxWidth: "20ch",
              }}
            >
              "Hair considered in daylight, in evening rooms, and under the flash of a camera."
            </p>
          </div>
        </div>
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

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="border-b border-border bg-secondary">
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

      {/* ── SALONS / LOCATIONS ──────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="mb-xl grid gap-sm lg:mb-xxl lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:items-end lg:gap-xl">
            <div>
              <p className="mb-sm font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                {clientConfig.copy.salons.eyebrow}
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
                {clientConfig.copy.salons.title}
              </h2>
            </div>
            <p
              className="text-body lg:max-w-[44ch]"
              style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8 }}
            >
              {clientConfig.copy.salons.intro}
            </p>
          </div>

          <div className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location, index) => (
              <article
                key={location.id}
                className="border border-border bg-card p-md sm:p-lg"
              >
                <p className="mb-xs font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3
                  className="mb-sm font-display uppercase text-fg"
                  style={{
                    fontSize: "var(--display-sm-size)",
                    letterSpacing: "var(--display-sm-tracking)",
                  }}
                >
                  {location.name}
                </h3>
                <p
                  className="mb-md text-body"
                  style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.7 }}
                >
                  {location.address}
                </p>
                <div className="border-t border-border pt-sm">
                  <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                    {clientConfig.copy.salons.appointmentLine}
                  </p>
                  {location.phone && (
                    <a
                      href={`tel:${location.phone}`}
                      className="mt-xxs block font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg"
                    >
                      {location.phone}
                    </a>
                  )}
                </div>
              </article>
            ))}
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
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl sm:py-xxl lg:py-section">
          <div className="grid gap-md lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-sm">
              <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                Reserve
              </p>
              <h2
                className="font-display uppercase text-fg"
                style={{
                  fontSize: "clamp(2rem, 6vw, 4rem)",
                  lineHeight: 0.98,
                  letterSpacing: "0.05em",
                  maxWidth: "14ch",
                }}
              >
                The chair is ready when you are.
              </h2>
              <p
                className="text-body"
                style={{ fontSize: "var(--body-md-size)", lineHeight: 1.8, maxWidth: "44ch" }}
              >
                Walk-ins are welcomed when the schedule allows. A reservation keeps the hour, the stylist, and the service in order before you arrive — and is always the wiser approach.
              </p>
            </div>
            <Link
              href="/book"
              className="self-end inline-flex h-11 items-center justify-center border border-accent px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-accent transition-opacity hover:opacity-70"
              style={{ borderRadius: "var(--radius-pill)" }}
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
                  className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg transition-opacity hover:opacity-70"
                >
                  {clientConfig.contact.instagram}
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

      {/* Marquee animation */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  );
}
