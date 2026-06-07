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
    redirect(`/book/service`);
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
            href={`/book/service`}
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

  // Hardcoded fallback uses real DB UUIDs — works even if admin client cold-starts
  if (categories.length === 0) {
    categories = [
      { id: "25757d6e-df0f-4f83-9e3d-61db4fbaed95", name: "Cut & Style", sort_order: 1 },
      { id: "8c8c8a0b-6965-4519-a759-3e91f8249d9b", name: "Color", sort_order: 2 },
      { id: "f61bb170-44e7-47ec-a963-6dff86d5ac86", name: "Treatments", sort_order: 3 },
      { id: "4743b403-18ae-464d-b36e-885c3e68884d", name: "Bridal", sort_order: 4 },
      { id: "382da47e-bdaf-4317-ad51-b33a65bfd3c0", name: "Gentleman's Grooming", sort_order: 5 },
    ];
    services = [
      { id: "df9d1c3e-2897-4c5a-b8ab-4a13d45184e0", category_id: "25757d6e-df0f-4f83-9e3d-61db4fbaed95", name: "Haircut & Style — Ladies", slug: "haircut-style-ladies", duration_min: 60, price_cents: 4500, description: null, requires_consultation: false },
      { id: "28200ad1-0211-420e-b102-b58743cff2e0", category_id: "25757d6e-df0f-4f83-9e3d-61db4fbaed95", name: "Haircut & Style — Men", slug: "haircut-style-men", duration_min: 45, price_cents: 3000, description: null, requires_consultation: false },
      { id: "f269d79b-168b-4a43-88b0-37c0d001ffb8", category_id: "25757d6e-df0f-4f83-9e3d-61db4fbaed95", name: "Children's Cut (under 12)", slug: "childrens-cut-under-12", duration_min: 30, price_cents: 2000, description: null, requires_consultation: false },
      { id: "e9bab449-3cf7-4d34-8741-80c830510ef2", category_id: "25757d6e-df0f-4f83-9e3d-61db4fbaed95", name: "Blow-Dry & Styling", slug: "blow-dry-styling", duration_min: 45, price_cents: 3500, description: null, requires_consultation: false },
      { id: "0a27b8dc-a237-41fa-9318-d67a4f59484b", category_id: "8c8c8a0b-6965-4519-a759-3e91f8249d9b", name: "Hair Color (single process)", slug: "hair-color-single-process", duration_min: 120, price_cents: 9000, description: null, requires_consultation: false },
      { id: "98e0f3a0-25f6-42bc-bae6-159442b8c784", category_id: "8c8c8a0b-6965-4519-a759-3e91f8249d9b", name: "Highlights / Balayage", slug: "highlights-balayage", duration_min: 180, price_cents: 18000, description: null, requires_consultation: false },
      { id: "0bb96e61-b972-4ae9-9366-0ed0cee78c92", category_id: "8c8c8a0b-6965-4519-a759-3e91f8249d9b", name: "Color Correction", slug: "color-correction", duration_min: 240, price_cents: 25000, description: null, requires_consultation: true },
      { id: "986df84f-ca60-493c-a4d6-051287158595", category_id: "f61bb170-44e7-47ec-a963-6dff86d5ac86", name: "Keratin Treatment", slug: "keratin-treatment", duration_min: 180, price_cents: 20000, description: null, requires_consultation: false },
      { id: "44562598-93bf-4904-a960-6b66f025e001", category_id: "f61bb170-44e7-47ec-a963-6dff86d5ac86", name: "Hair Botox", slug: "hair-botox", duration_min: 150, price_cents: 15000, description: null, requires_consultation: false },
      { id: "dd4d123f-e6e6-46e5-b2e2-820fc75a2cd5", category_id: "4743b403-18ae-464d-b36e-885c3e68884d", name: "Bridal Hair (trial)", slug: "bridal-hair-trial", duration_min: 90, price_cents: 12000, description: null, requires_consultation: false },
      { id: "bed0869c-2f00-452f-b38b-d88627dbe98e", category_id: "4743b403-18ae-464d-b36e-885c3e68884d", name: "Bridal Hair (day-of)", slug: "bridal-hair-day-of", duration_min: 120, price_cents: 25000, description: null, requires_consultation: false },
      { id: "5d248927-f747-43ce-81cf-bdc27a1ec3ba", category_id: "382da47e-bdaf-4317-ad51-b33a65bfd3c0", name: "Beard Trim & Shape", slug: "beard-trim-shape", duration_min: 30, price_cents: 2000, description: null, requires_consultation: false },
      { id: "467df4b9-df7b-4547-b25d-63095f367677", category_id: "382da47e-bdaf-4317-ad51-b33a65bfd3c0", name: "Traditional Hot Shave", slug: "traditional-hot-shave", duration_min: 45, price_cents: 3000, description: null, requires_consultation: false },
    ];
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
                    href={`/book/stylist?svc=${svc.id}`}
                    className={`group flex items-center justify-between gap-md py-md transition-colors hover:bg-secondary -mx-md px-md sm:-mx-xl sm:px-xl ${
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
                    <div className="flex shrink-0 items-center gap-sm text-right">
                      <div>
                        <p className="hidden font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg sm:block">
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
                      <span
                        className="font-mono text-muted-fg transition-transform group-hover:translate-x-1"
                        aria-hidden
                      >
                        →
                      </span>
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

  // Hardcoded fallback uses real DB UUIDs
  if (staffList.length === 0) {
    staffList = [
      { id: "80996400-0a22-4735-aa4d-821ad8a2faf9", name: "Zakaria Haddad", slug: "zakaria-haddad", photo_url: null, bio: "Cutting with a measured hand and a preference for quiet polish.", title: "Master Stylist" },
      { id: "af7b6a97-29a8-46d0-97e6-48facb2c4a97", name: "Yehya Khoury", slug: "yehya-khoury", photo_url: null, bio: "A senior eye for shape, movement, and the discipline of finish.", title: "Creative Director" },
      { id: "3dabcad4-f9df-463d-9f08-ead03118169e", name: "Mira Daher", slug: "mira-daher", photo_url: null, bio: "Known for colour that reads softly in daylight and under flash.", title: "Senior Colorist" },
      { id: "0dd51719-d3ce-4f47-917d-4dc6d3ce52f7", name: "Lea Sayegh", slug: "lea-sayegh", photo_url: null, bio: "Bridal dressing with calm structure and a light editorial touch.", title: "Bridal Specialist" },
      { id: "9c83e6eb-0f8d-42c5-ac37-dfc6aec7ad7e", name: "Omar Haddad", slug: "omar-haddad", photo_url: null, bio: "Traditional grooming, carried with restraint and exactness.", title: "Grooming Specialist" },
      { id: "d1aca83f-3995-415d-a26d-424b46832991", name: "Tony Azzam", slug: "tony-azzam", photo_url: null, bio: "A classic barber's line, sharpened for contemporary clients.", title: "Senior Barber" },
      { id: "53ffff75-29b6-4239-bd24-267e0db38c31", name: "Rana Nasr", slug: "rana-nasr", photo_url: null, bio: "Treatment-led care for texture, softness, and enduring shine.", title: "Treatment Specialist" },
      { id: "5d0756f8-89bb-42c4-a8d4-98b9aac6a35e", name: "Nadim Hanna", slug: "nadim-hanna", photo_url: null, bio: "A careful junior hand, especially suited to effortless daily styling.", title: "Junior Stylist" },
    ];
  }

  return (
    <div>
      <SectionHead eyebrow="Step 2 of 5" title="Choose your stylist." />

      <div className="grid gap-xs sm:grid-cols-2 lg:grid-cols-3">
        {/* Any available option */}
        <Link
          href={`/book/date?svc=${svc}&staff=any`}
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
            href={`/book/date?svc=${svc}&staff=${member.id}`}
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
      <TimePicker slots={slots} svc={svc} staff={staff} date={date} />
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

  // Single location — Verdun UUID is fixed, never read from URL
  const LOC = "adccf684-03bf-43f6-bd41-36e4cd6db8c4";

  const svc = str(sp, "svc");
  const staff = str(sp, "staff");
  const date = str(sp, "date");
  const time = str(sp, "time");

  // Back href
  const backParams = new URLSearchParams();
  if (svc) backParams.set("svc", svc);
  if (staff) backParams.set("staff", staff);
  if (date) backParams.set("date", date);
  const prevStep = stepIndex > 0 ? STEPS[stepIndex - 1] : null;
  const backHref = prevStep
    ? `/book/${prevStep}${backParams.size ? "?" + backParams.toString() : ""}`
    : "/";

  // Guard: redirect if required params are missing or not valid UUIDs
  const isUUID = (v?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v ?? "");

  if (currentStep === "stylist" && (!svc || !isUUID(svc))) redirect("/book");
  if (currentStep === "date" && (!svc || !staff || !isUUID(svc))) redirect("/book");
  if (currentStep === "time" && (!svc || !staff || !date || !isUUID(svc) || (staff !== "any" && !isUUID(staff)))) redirect("/book");
  if (currentStep === "confirm" && (!svc || !staff || !date || !time || !isUUID(svc) || (staff !== "any" && !isUUID(staff)))) redirect("/book");

  function StepContent() {
    switch (currentStep) {
      case "service":
        return <ServiceStep loc={LOC} />;
      case "stylist":
        return <StylistStep loc={LOC} svc={svc!} />;
      case "date":
        return <DateStep loc={LOC} svc={svc!} staff={staff!} />;
      case "time":
        return <TimeStep loc={LOC} svc={svc!} staff={staff!} date={date!} />;
      case "confirm":
        return (
          <ConfirmStep
            loc={LOC}
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
