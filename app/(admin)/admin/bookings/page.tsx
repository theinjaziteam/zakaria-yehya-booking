import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { CancelBookingButton } from "@/components/admin/cancel-booking-button";

const TZ = "Asia/Beirut";

type Location = { id: string; name: string; slug: string };

type BookingRow = {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  starts_at: string;
  status: string;
  location_name: string;
  service_name: string;
  service_price_cents: number;
  staff_name: string;
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  confirmed: { color: "var(--fg)" },
  cancelled: { color: "var(--muted-fg)" },
  completed: { color: "var(--success)" },
  no_show: { color: "var(--warning)" },
};

async function getLocations(): Promise<Location[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, slug")
      .eq("active", true)
      .order("name");
    return (data as Location[] | null) ?? [];
  } catch {
    return [];
  }
}

function filterBookings(bookings: BookingRow[], q: string): BookingRow[] {
  const term = q.toLowerCase().trim();
  if (!term) return bookings;
  return bookings.filter(
    (b) =>
      b.reference_code.toLowerCase().includes(term) ||
      b.customer_name.toLowerCase().includes(term) ||
      b.customer_phone.includes(term) ||
      b.staff_name.toLowerCase().includes(term) ||
      b.service_name.toLowerCase().includes(term) ||
      b.location_name.toLowerCase().includes(term),
  );
}

async function getBookings(
  view: "today" | "all",
  locationId: string | null,
): Promise<BookingRow[]> {
  try {
    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("bookings")
      .select(
        "id, reference_code, customer_name, customer_phone, customer_email, starts_at, status, locations!inner(name), services!inner(name, price_cents), staff!inner(name)",
      )
      .order("starts_at", { ascending: view === "today" })
      .limit(200);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    if (view === "today") {
      const now = new Date();
      const todayLocal = formatInTimeZone(now, TZ, "yyyy-MM-dd");
      const startISO = fromZonedTime(new Date(`${todayLocal}T00:00:00`), TZ).toISOString();
      const endISO = fromZonedTime(new Date(`${todayLocal}T23:59:59`), TZ).toISOString();
      query = query.gte("starts_at", startISO).lte("starts_at", endISO);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as unknown[]).map((r: unknown) => {
      const row = r as Record<string, unknown>;
      const loc = (row.locations as Record<string, unknown>) ?? {};
      const svc = (row.services as Record<string, unknown>) ?? {};
      const stf = (row.staff as Record<string, unknown>) ?? {};
      return {
        id: String(row.id ?? ""),
        reference_code: String(row.reference_code ?? ""),
        customer_name: String(row.customer_name ?? ""),
        customer_phone: String(row.customer_phone ?? ""),
        customer_email: (row.customer_email as string | null) ?? null,
        starts_at: String(row.starts_at ?? ""),
        status: String(row.status ?? "confirmed"),
        location_name: String(loc.name ?? "—"),
        service_name: String(svc.name ?? "—"),
        service_price_cents: Number(svc.price_cents ?? 0),
        staff_name: String(stf.name ?? "—"),
      };
    });
  } catch {
    return [];
  }
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function safeFormatDt(ts: string): string {
  try {
    return formatInTimeZone(
      new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00")),
      TZ,
      "EEE d MMM · HH:mm",
    );
  } catch {
    return ts;
  }
}

function safeFormatTime(ts: string): string {
  try {
    return formatInTimeZone(
      new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00")),
      TZ,
      "HH:mm",
    );
  } catch {
    return "—";
  }
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const view = sp.view === "all" ? "all" : "today";
  const locSlug = sp.loc ?? "all";
  const q = (sp.q ?? "").trim();

  const locations = await getLocations();
  const selectedLocation =
    locSlug === "all" ? null : (locations.find((l) => l.slug === locSlug) ?? null);

  const allBookings = await getBookings(view, selectedLocation?.id ?? null);
  const bookings = filterBookings(allBookings, q);
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  function branchHref(slug: string) {
    const p = new URLSearchParams({ loc: slug, view });
    if (q) p.set("q", q);
    return `/admin/bookings?${p}`;
  }
  function viewHref(v: string) {
    const p = new URLSearchParams({ loc: locSlug, view: v });
    if (q) p.set("q", q);
    return `/admin/bookings?${p}`;
  }

  const activeStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#000000",
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted-fg">
          Admin · Bookings
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">
          {selectedLocation ? selectedLocation.name : "All Salons"}
        </h1>
        <div className="mt-3 flex flex-wrap gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-fg">
            {bookings.length} total
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-fg">
            {confirmed} confirmed
          </span>
          {cancelled > 0 && (
            <span className="font-mono text-xs uppercase tracking-widest text-muted-fg">
              {cancelled} cancelled
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Branch tabs */}
        <div className="flex border border-border">
          <Link
            href={branchHref("all")}
            style={locSlug === "all" ? activeStyle : {}}
            className={`px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              locSlug === "all" ? "" : "text-muted-fg hover:text-fg"
            }`}
          >
            All
          </Link>
          {locations.map((loc) => (
            <Link
              key={loc.id}
              href={branchHref(loc.slug)}
              style={locSlug === loc.slug ? activeStyle : {}}
              className={`border-l border-border px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                locSlug === loc.slug ? "" : "text-muted-fg hover:text-fg"
              }`}
            >
              {loc.name}
            </Link>
          ))}
        </div>

        {/* Today / All toggle */}
        <div className="flex border border-border">
          <Link
            href={viewHref("today")}
            style={view === "today" ? activeStyle : {}}
            className={`px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              view === "today" ? "" : "text-muted-fg hover:text-fg"
            }`}
          >
            Today
          </Link>
          <Link
            href={viewHref("all")}
            style={view === "all" ? activeStyle : {}}
            className={`border-l border-border px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
              view === "all" ? "" : "text-muted-fg hover:text-fg"
            }`}
          >
            All
          </Link>
        </div>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/bookings" className="mb-6 flex gap-3">
        <input type="hidden" name="loc" value={locSlug} />
        <input type="hidden" name="view" value={view} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search ref, client, stylist, service…"
          className="flex-1 border border-border bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-muted-fg transition-colors hover:border-fg hover:text-fg"
        >
          Search
        </button>
        {q && (
          <a
            href={`/admin/bookings?loc=${locSlug}&view=${view}`}
            className="shrink-0 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-fg transition-colors hover:border-fg hover:text-fg"
          >
            Clear
          </a>
        )}
      </form>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <p className="font-display text-xl uppercase tracking-wide text-fg">
            {view === "today" ? "No appointments today." : "No bookings yet."}
          </p>
          <p className="mt-2 text-sm text-muted-fg">
            {view === "today"
              ? "Today's bookings will appear here."
              : "Bookings will appear here once made."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Ref", "Client", "Service", "Stylist", "Salon", "Value", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-2 pr-4 text-left font-mono text-xs uppercase tracking-widest text-muted-fg"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className={i < bookings.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="py-3 pr-4 font-mono text-sm text-fg whitespace-nowrap">
                      {view === "today" ? safeFormatTime(b.starts_at) : safeFormatDt(b.starts_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/booking/${b.reference_code}`}
                        target="_blank"
                        className="font-mono text-xs uppercase tracking-widest text-accent hover:opacity-70"
                      >
                        {b.reference_code}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-fg">{b.customer_name}</p>
                      <p className="text-xs text-muted-fg">{b.customer_phone}</p>
                    </td>
                    <td className="py-3 pr-4 text-fg">{b.service_name}</td>
                    <td className="py-3 pr-4 text-fg">{b.staff_name}</td>
                    <td className="py-3 pr-4 text-muted-fg">{b.location_name}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-fg">
                      {formatPrice(b.service_price_cents)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="font-mono text-xs uppercase tracking-widest"
                        style={STATUS_STYLE[b.status] ?? { color: "var(--fg)" }}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      {b.status === "confirmed" && (
                        <CancelBookingButton refCode={b.reference_code} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {bookings.map((b) => (
              <div key={b.id} className="grid gap-3 border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-base font-medium text-fg">
                      {view === "today" ? safeFormatTime(b.starts_at) : safeFormatDt(b.starts_at)}
                    </p>
                    <Link
                      href={`/booking/${b.reference_code}`}
                      target="_blank"
                      className="font-mono text-xs uppercase tracking-widest text-accent"
                    >
                      {b.reference_code}
                    </Link>
                  </div>
                  <span
                    className="font-mono text-xs uppercase tracking-widest"
                    style={STATUS_STYLE[b.status] ?? { color: "var(--fg)" }}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-base font-medium text-fg">{b.customer_name}</p>
                  <p className="text-sm text-muted-fg">{b.customer_phone}</p>
                </div>
                <p className="text-sm text-muted-fg">
                  {b.service_name} · {b.staff_name} · {b.location_name} ·{" "}
                  {formatPrice(b.service_price_cents)}
                </p>
                {b.status === "confirmed" && (
                  <CancelBookingButton refCode={b.reference_code} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
