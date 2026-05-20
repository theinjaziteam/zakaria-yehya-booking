export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Stepper } from "@/components/booking/stepper";
import { DatePicker } from "@/components/booking/date-picker";
import { TimePicker } from "@/components/booking/time-picker";
import { ConfirmForm } from "@/components/booking/confirm-form";
import { clientConfig } from "@/config/client";
import { eachDayOfInterval, parseISO, getDay, format } from "date-fns";
import { todayDate, windowEndDate, formatDisplayDate, formatTime } from "@/lib/utils/time";
import type { AvailableDay, Slot } from "@/lib/booking/slots";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

const STEPS = ["service", "stylist", "date", "time", "confirm"] as const;
type StepName = (typeof STEPS)[number];

type SP = Record<string, string | string[] | undefined>;

function str(sp: SP, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

// ──────────────────────────────────────────────
// DB types
// ──────────────────────────────────────────────

type Location = {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string | null;
  timezone: string;
};

type ServiceCategory = {
  id: string;
  name: string;
  sort_order: number;
};

type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  requires_consultation: boolean;
};

type Staff = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  title: string | null;
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatPrice(cents: number) {
  return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`;
}

function formatDur(min: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${min} min`;
}

function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-xs font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg transition-opacity hover:opacity-70"
    >
      ← {label}
    </Link>
  );
}

function SectionHead({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-xl grid gap-sm">
      <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
        {eyebrow}
      </p>
      <h1
        className="font-display uppercase text-fg"
        style={{
          fontSize: "clamp(1.75rem, 5vw, 3rem)",
          lineHeight: 1.04,
          letterSpacing: "0.05em",
          maxWidth: "16ch",
        }}
      >
        {title}
      </h1>
    </div>
  );
}

// ──────────────────────────────────────────────
// Supabase helper (no-op if env missing)
// ──────────────────────────────────────────────

async function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  // Prefer admin client (no cookies dependency, always works server-side).
  // Falls back to anon server client if service role key is absent.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    return createAdminSupabaseClient();
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  return createServerSupabaseClient();
}

// ──────────────────────────────────────────────
// STEP: Location
// ──────────────────────────────────────────────

async function LocationStep() {
  const supabase = await getSupabase();

  let locations: Location[] = [];
  if (supabase) {
    try {
      const { data } = await (await supabase)
        .from("locations")
        .select("id, slug, name, address, phone, timezone")
        .eq("active", true)
        .in("slug", clientConfig.presentation.locationOrder)
        .order("name");
      locations = (data as Location[] | null) ?? [];
    } catch {
      /* fall through to demo data */
    }
  }

  // Demo fallback
  if (locations.length === 0) {
    locations = [
      {
        id: "demo-verdun",
        slug: "verdun",
        name: "Verdun",
        address: "Rashid Karameh Street, Shad Building, Verdun, Beirut",
        phone: "+961 1 780 710",
        timezone: "Asia/Beirut",
      },
    ];
  }

  // Only one location — skip the selection step entirely
  if (locations.length === 1) {
    redirect(`/book/service?loc=${locations[0]!.id}`);
  }

  return (
    <div>
      <SectionHead
        eyebrow="Step 1 of 6"
        title="Choose your salon."
      />
      <div className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc, i) => (
          <Link
            key={loc.id}
            href={`/book/service?loc=${loc.id}`}
            className="group block border border-border bg-card p-md transition-colors hover:border-fg sm:p-lg"
          >
            <p className="mb-xs font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h2
              className="mb-sm font-display uppercase text-fg group-hover:opacity-80"
              style={{
                fontSize: "var(--display-sm-size)",
                letterSpacing: "var(--display-sm-tracking)",
              }}
            >
              {loc.name}
            </h2>
            <p
              className="text-body"
              style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}
            >
              {loc.address}
            </p>
            <p className="mt-sm font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              {clientConfig.copy.salons.appointmentLine}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// STEP: Service
// ──────────────────────────────────────────────

async function ServiceStep({ loc }: { loc: string }) {
  const supabase = await getSupabase();

  let categories: ServiceCategory[] = [];
  let services: Service[] = [];

  if (supabase) {
    try {
      const [catRes, svcRes] = await Promise.all([
        (await supabase)
          .from("service_categories")
          .select("id, name, sort_order")
          .order("sort_order"),
        (await supabase)
          .from("services")
          .select(
            "id, category_id, name, slug, duration_min, price_cents, description, requires_consultation",
          )
          .eq("active", true)
          .order("sort_order"),
      ]);
      categories = (catRes.data as ServiceCategory[] | null) ?? [];
      services = (svcRes.data as Service[] | null) ?? [];
    } catch {
      /* fall through */
    }
  }

  if (categories.length === 0) {
    return (
      <div>
        <SectionHead eyebrow="Step 1 of 5" title="Choose a service." />
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">
          Unable to load services. Please try again or call us directly.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionHead eyebrow="Step 1 of 5" title="Choose a service." />

      <div className="grid gap-xl">
        {categories.map((cat) => {
          const catServices = services.filter(
            (s) => s.category_id === cat.id,
          );
          if (catServices.length === 0) return null;

          return (
            <div key={cat.id}>
              <p className="mb-sm border-b border-border pb-xs font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                {cat.name}
              </p>
              <div>
                {catServices.map((svc, i) => (
                  <Link
                    key={svc.id}
                    href={`/book/stylist?loc=${loc}&svc=${svc.id}`}
                    className={`group flex items-center justify-between gap-md py-md transition-opacity hover:opacity-70 ${
                      i < catServices.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-xs">
                        <span
                          className="font-display uppercase text-fg"
                          style={{
                            fontSize: "var(--title-md-size)",
                            letterSpacing: "var(--title-md-tracking)",
                          }}
                        >
                          {svc.name}
                        </span>
                        {svc.requires_consultation && (
                          <span className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                            Consultation required
                          </span>
                        )}
                      </div>
                      {svc.description && (
                        <p
                          className="mt-xxs text-muted-fg"
                          style={{ fontSize: "var(--body-sm-size)" }}
                        >
                          {svc.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg">
                        {formatDur(svc.duration_min)}
                      </p>
                      <p
                        className="font-mono text-fg"
                        style={{
                          fontSize: "var(--title-sm-size)",
                          letterSpacing: "var(--title-sm-tracking)",
                        }}
                      >
                        {formatPrice(svc.price_cents)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// STEP: Stylist
// ──────────────────────────────────────────────

async function StylistStep({ loc, svc }: { loc: string; svc: string }) {
  const supabase = await getSupabase();
  let staffList: Staff[] = [];

  if (supabase) {
    try {
      const client = await supabase;

      // Get staff IDs at this location
      const { data: atLoc } = await client
        .from("staff_locations")
        .select("staff_id")
        .eq("location_id", loc);

      // Get staff IDs for this service
      const { data: forSvc } = await client
        .from("staff_services")
        .select("staff_id")
        .eq("service_id", svc);

      const atLocIds = (atLoc ?? []).map((r: { staff_id: string }) => r.staff_id);
      const forSvcIds = (forSvc ?? []).map((r: { staff_id: string }) => r.staff_id);
      const eligible = atLocIds.filter((id) => forSvcIds.includes(id));

      if (eligible.length > 0) {
        const { data } = await client
          .from("staff")
          .select("id, name, slug, photo_url, bio, title")
          .in("id", eligible)
          .eq("active", true)
          .order("sort_order");
        staffList = (data as Staff[] | null) ?? [];
      }
    } catch {
      /* fall through */
    }
  }

  if (staffList.length === 0) {
    return (
      <div>
        <SectionHead eyebrow="Step 2 of 5" title="Choose your stylist." />
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">
          No stylists available for this service. Please go back and try another.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionHead eyebrow="Step 2 of 5" title="Choose your stylist." />

      <div className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
        {/* Any available option */}
        <Link
          href={`/book/date?loc=${loc}&svc=${svc}&staff=any`}
          className="group flex items-center gap-md border border-border bg-card p-md transition-colors hover:border-fg sm:p-lg"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-secondary">
            <span className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
              Any
            </span>
          </div>
          <div>
            <p
              className="font-display uppercase text-fg"
              style={{
                fontSize: "var(--title-md-size)",
                letterSpacing: "var(--title-md-tracking)",
              }}
            >
              Next available
            </p>
            <p
              className="mt-xxs text-muted-fg"
              style={{ fontSize: "var(--body-sm-size)" }}
            >
              The first open slot across all stylists
            </p>
          </div>
        </Link>

        {staffList.map((member) => (
          <Link
            key={member.id}
            href={`/book/date?loc=${loc}&svc=${svc}&staff=${member.id}`}
            className="group flex items-center gap-md border border-border bg-card p-md transition-colors hover:border-fg sm:p-lg"
          >
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.name}
                className="h-14 w-14 shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-secondary">
                <span className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p
                className="font-display uppercase text-fg group-hover:opacity-80"
                style={{
                  fontSize: "var(--title-md-size)",
                  letterSpacing: "var(--title-md-tracking)",
                }}
              >
                {member.name}
              </p>
              {member.title && (
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                  {member.title}
                </p>
              )}
              {member.bio && (
                <p
                  className="mt-xxs text-body"
                  style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.5 }}
                >
                  {member.bio}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// STEP: Date
// ──────────────────────────────────────────────

async function DateStep({
  loc,
  svc,
  staff,
}: {
  loc: string;
  svc: string;
  staff: string;
}) {
  const from = todayDate();
  const to = windowEndDate();

  let availableDays: AvailableDay[] | null = null;

  const supabase = await getSupabase();
  if (supabase) {
    try {
      const client = await supabase;

      if (staff !== "any") {
        const { data } = await client.rpc("get_available_days", {
          p_staff_id: staff,
          p_service_id: svc,
          p_location_id: loc,
          p_from: from,
          p_to: to,
        });
        if (data) {
          availableDays = (data as Array<{ day: string; has_availability: boolean }>).map(
            (r) => ({ date: r.day, available: r.has_availability }),
          );
        }
      } else {
        // "any" staff — leave availableDays null so all weekdays show as
        // selectable. Real slot availability is resolved in the time step.
        availableDays = null;
      }
    } catch {
      /* fall through – null keeps all days selectable */
    }
  }

  return (
    <div>
      <SectionHead eyebrow="Step 3 of 5" title="Choose a date." />
      <DatePicker
        loc={loc}
        svc={svc}
        staff={staff}
        from={from}
        to={to}
        availableDays={availableDays}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// STEP: Time
// ──────────────────────────────────────────────

async function TimeStep({
  loc,
  svc,
  staff,
  date,
}: {
  loc: string;
  svc: string;
  staff: string;
  date: string;
}) {
  let slots: Slot[] | null = null;

  const supabase = await getSupabase();
  if (supabase && staff !== "any") {
    try {
      const { data, error } = await (await supabase).rpc("get_available_slots", {
        p_staff_id: staff,
        p_service_id: svc,
        p_date: date,
        p_location_id: loc,
      });
      if (error) { console.error("get_available_slots:", error.message); slots = []; }
      else if (data) slots = data as Slot[];
      else slots = [];
    } catch (e) {
      console.error("get_available_slots threw:", e);
      slots = [];
    }
  } else if (supabase && staff === "any") {
    // For "any" staff — get all eligible staff, merge slots
    try {
      const client = await supabase;
      const { data: atLoc } = await client
        .from("staff_locations")
        .select("staff_id")
        .eq("location_id", loc);
      const { data: forSvc } = await client
        .from("staff_services")
        .select("staff_id")
        .eq("service_id", svc);

      const atLocIds = (atLoc ?? []).map((r: { staff_id: string }) => r.staff_id);
      const forSvcIds = (forSvc ?? []).map((r: { staff_id: string }) => r.staff_id);
      const eligible = atLocIds.filter((id) => forSvcIds.includes(id));

      const allSlots: Slot[] = [];
      for (const staffId of eligible) {
        const { data, error } = await client.rpc("get_available_slots", {
          p_staff_id: staffId,
          p_service_id: svc,
          p_date: date,
          p_location_id: loc,
        });
        if (error) console.error("get_available_slots (any):", staffId, error.message);
        if (data) allSlots.push(...(data as Slot[]));
      }

      // Deduplicate by time — a slot is available if any staff has it
      const byTime = new Map<string, boolean>();
      for (const s of allSlots) {
        const t = formatTime(s.starts_at);
        byTime.set(t, (byTime.get(t) ?? false) || s.available);
      }

      // Sort and reconstruct
      slots = Array.from(byTime.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([timeKey, available]) => ({
          starts_at: allSlots.find(
            (s) => formatTime(s.starts_at) === timeKey,
          )!.starts_at,
          available,
        }));
    } catch (e) {
      console.error("TimeStep any catch:", e);
      slots = [];
    }
  }

  return (
    <div>
      <SectionHead
        eyebrow="Step 4 of 5"
        title={`Available times · ${formatDisplayDate(date)}`}
      />
      <TimePicker slots={slots} loc={loc} svc={svc} staff={staff} date={date} />
    </div>
  );
}

// ──────────────────────────────────────────────
// STEP: Confirm
// ──────────────────────────────────────────────

async function ConfirmStep({
  loc,
  svc,
  staff,
  date,
  time,
}: {
  loc: string;
  svc: string;
  staff: string;
  date: string;
  time: string;
}) {
  // Fetch summary data + products
  let location: Location | null = null;
  let service: Service | null = null;
  let staffMember: Staff | null = null;
  let products: import("@/components/products-section").Product[] = [];

  const supabase = await getSupabase();
  if (supabase) {
    try {
      const client = await supabase;
      const [locRes, svcRes, prodRes] = await Promise.all([
        client
          .from("locations")
          .select("id, slug, name, address, phone, timezone")
          .eq("id", loc)
          .single(),
        client
          .from("services")
          .select(
            "id, category_id, name, slug, duration_min, price_cents, description, requires_consultation",
          )
          .eq("id", svc)
          .single(),
        client
          .from("products")
          .select("id, name, description, price_cents, image_url")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);
      location = (locRes.data as Location | null) ?? null;
      service = (svcRes.data as Service | null) ?? null;
      products = (prodRes.data as typeof products | null) ?? [];

      if (staff !== "any") {
        const { data } = await client
          .from("staff")
          .select("id, name, slug, photo_url, bio, title")
          .eq("id", staff)
          .single();
        staffMember = (data as Staff | null) ?? null;
      }
    } catch {
      /* fall through */
    }
  }

  const summaryItems = [
    { label: "Salon", value: location?.name ?? "—" },
    { label: "Address", value: location?.address ?? "—" },
    {
      label: "Service",
      value: service
        ? `${service.name} · ${formatDur(service.duration_min)} · ${formatPrice(service.price_cents)}`
        : "—",
    },
    {
      label: "Stylist",
      value:
        staff === "any"
          ? "Next available"
          : staffMember?.name ?? "—",
    },
    { label: "Date", value: formatDisplayDate(date) },
    { label: "Time", value: time },
  ];

  return (
    <div className="grid gap-xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-xxl">
      {/* Booking summary */}
      <div>
        <SectionHead eyebrow="Step 5 of 5" title="Confirm your reservation." />

        <div className="border border-border bg-card p-md sm:p-lg">
          <p className="mb-md font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
            Reservation summary
          </p>
          <div className="grid gap-0">
            {summaryItems.map((item, i) => (
              <div
                key={item.label}
                className={`grid grid-cols-[6rem_1fr] gap-md py-sm ${
                  i < summaryItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
                  {item.label}
                </p>
                <p
                  className="text-fg"
                  style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.5 }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {service?.requires_consultation && (
          <div className="mt-sm border border-warning bg-card px-md py-sm">
            <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-warning">
              Consultation note
            </p>
            <p
              className="mt-xxs text-body"
              style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}
            >
              This service is reviewed before it is treated as final. A brief
              consultation will be arranged to confirm the scope of work.
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="lg:pt-[4.5rem]">
        <p className="mb-lg font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
          Your details
        </p>
        <ConfirmForm
          loc={loc}
          svc={svc}
          staff={staff}
          date={date}
          time={time}
          products={products}
          servicePriceCents={service?.price_cents ?? 0}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// PAGE
// ──────────────────────────────────────────────

export default async function BookingStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<SP>;
}) {
  const { step } = await params;
  const sp = await searchParams;

  if (!(STEPS as readonly string[]).includes(step)) notFound();
  const currentStep = step as StepName;
  const stepIndex = STEPS.indexOf(currentStep);

  // Param helpers
  const loc = str(sp, "loc");
  const svc = str(sp, "svc");
  const staff = str(sp, "staff");
  const date = str(sp, "date");
  const time = str(sp, "time");

  // Back href — carries accumulated params to previous step
  const backParams = new URLSearchParams();
  if (loc) backParams.set("loc", loc);
  if (svc) backParams.set("svc", svc);
  if (staff) backParams.set("staff", staff);
  if (date) backParams.set("date", date);
  const prevStep = stepIndex > 0 ? STEPS[stepIndex - 1] : null;
  const backHref = prevStep
    ? `/book/${prevStep}${backParams.size ? "?" + backParams.toString() : ""}`
    : "/";

  // UUID shape check — demo IDs like "s1" must never propagate
  const isUUID = (v?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v ?? "");

  // Guard: redirect to /book (entry point) if required params are missing or invalid
  if (currentStep === "service" && !loc) redirect("/book");
  if (currentStep === "stylist" && (!loc || !svc || !isUUID(loc) || !isUUID(svc))) redirect("/book");
  if (currentStep === "date" && (!loc || !svc || !staff || !isUUID(loc) || !isUUID(svc))) redirect("/book");
  if (currentStep === "time" && (!loc || !svc || !staff || !date || !isUUID(loc) || !isUUID(svc) || (staff !== "any" && !isUUID(staff)))) redirect("/book");
  if (currentStep === "confirm" && (!loc || !svc || !staff || !date || !time || !isUUID(loc) || !isUUID(svc) || (staff !== "any" && !isUUID(staff)))) redirect("/book");

  function StepContent() {
    switch (currentStep) {
      case "service":
        return <ServiceStep loc={loc!} />;
      case "stylist":
        return <StylistStep loc={loc!} svc={svc!} />;
      case "date":
        return <DateStep loc={loc!} svc={svc!} staff={staff!} />;
      case "time":
        return <TimeStep loc={loc!} svc={svc!} staff={staff!} date={date!} />;
      case "confirm":
        return (
          <ConfirmStep
            loc={loc!}
            svc={svc!}
            staff={staff!}
            date={date!}
            time={time!}
          />
        );
    }
  }

  return (
    <main className="bg-bg text-body">
      {/* Booking nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/95" style={{ backdropFilter: "blur(8px)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-md sm:px-xl">
          <Link
            href={backHref}
            className="inline-flex items-center gap-xs font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg transition-opacity hover:opacity-70 shrink-0"
          >
            <span aria-hidden>←</span>
            <span>{stepIndex === 0 ? "Home" : "Back"}</span>
          </Link>
          <p className="font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
            {clientConfig.brand.name}
          </p>
          {/* spacer keeps brand centred */}
          <span className="w-10 shrink-0" aria-hidden />
        </div>
      </nav>

      <Stepper currentIndex={stepIndex} />

      <div className="mx-auto max-w-5xl px-md pt-xl pb-xl sm:px-xl sm:pt-xxl sm:pb-xl">
        <StepContent />
      </div>
    </main>
  );
}
