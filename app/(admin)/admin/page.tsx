import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { clientConfig } from "@/config/client";
import Link from "next/link";
import { formatDisplayDatetime, formatTime } from "@/lib/utils/time";

type BookingRow = {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  location_name: string;
  service_name: string;
  service_duration_min: number;
  service_price_cents: number;
  staff_name: string;
  staff_title: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "var(--fg)",
  cancelled: "var(--muted-fg)",
  completed: "var(--success)",
  no_show: "var(--warning)",
};

async function getTodayBookings(): Promise<BookingRow[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const tz = clientConfig.business.defaultTimezone;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, reference_code, customer_name, customer_phone, customer_email,
        starts_at, ends_at, status, notes,
        locations!inner(name),
        services!inner(name, duration_min, price_cents),
        staff!inner(name, title)
      `)
      .gte("starts_at", new Date().toISOString().slice(0, 10) + "T00:00:00+00:00")
      .lt("starts_at", new Date().toISOString().slice(0, 10) + "T23:59:59+00:00")
      .order("starts_at", { ascending: true });

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
        ends_at: String(row.ends_at ?? ""),
        status: String(row.status ?? "confirmed"),
        notes: (row.notes as string | null) ?? null,
        location_name: String(loc.name ?? "—"),
        service_name: String(svc.name ?? "—"),
        service_duration_min: Number(svc.duration_min ?? 0),
        service_price_cents: Number(svc.price_cents ?? 0),
        staff_name: String(stf.name ?? "—"),
        staff_title: (stf.title as string | null) ?? null,
      };
    });
  } catch {
    return [];
  }
}

function formatPrice(cents: number) {
  return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`;
}

function parseTs(ts: string): Date {
  return new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00"));
}

function safeFormatTime(ts: string): string {
  try { return formatTime(ts); } catch { return "—"; }
}

export default async function AdminTodayPage() {
  const bookings = await getTodayBookings();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: clientConfig.business.defaultTimezone,
  }).toUpperCase();

  const confirmed = bookings.filter(b => b.status === "confirmed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;

  const labelBase = "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  return (
    <div>
      {/* Header */}
      <div className="mb-xl grid gap-sm border-b border-border pb-lg">
        <p className={labelBase}>Today</p>
        <h1 className="font-display uppercase text-fg"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "0.05em" }}>
          {today}
        </h1>
        <div className="flex gap-xl">
          <div>
            <p className="font-display uppercase text-fg"
              style={{ fontSize: "var(--display-sm-size)", letterSpacing: "var(--display-sm-tracking)" }}>
              {confirmed}
            </p>
            <p className={labelBase}>Confirmed</p>
          </div>
          <div>
            <p className="font-display uppercase text-fg"
              style={{ fontSize: "var(--display-sm-size)", letterSpacing: "var(--display-sm-tracking)" }}>
              {bookings.length}
            </p>
            <p className={labelBase}>Total today</p>
          </div>
          {cancelled > 0 && (
            <div>
              <p className="font-display uppercase text-fg"
                style={{ fontSize: "var(--display-sm-size)", letterSpacing: "var(--display-sm-tracking)" }}>
                {cancelled}
              </p>
              <p className={labelBase}>Cancelled</p>
            </div>
          )}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-border bg-card p-xl text-center">
          <p className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}>
            No appointments today.
          </p>
          <p className="mt-sm text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>
            Bookings for today will appear here as they are made.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block">
            <div className="grid gap-md border-b border-border pb-xs"
              style={{ gridTemplateColumns: "4rem 1fr 1fr 1fr 6rem 5rem" }}>
              {["Time", "Client", "Service", "Stylist", "Salon", "Status"].map(h => (
                <p key={h} className={labelBase}>{h}</p>
              ))}
            </div>
            {bookings.map((b, i) => (
              <Link
                key={b.id}
                href={`/booking/${b.reference_code}`}
                target="_blank"
                className={`grid gap-md py-md transition-opacity hover:opacity-70 ${
                  i < bookings.length - 1 ? "border-b border-border" : ""
                }`}
                style={{ gridTemplateColumns: "4rem 1fr 1fr 1fr 6rem 5rem" }}
              >
                <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg">
                  {safeFormatTime(b.starts_at)}
                </p>
                <div className="min-w-0">
                  <p className="truncate text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.customer_name}</p>
                  <p className="truncate text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>{b.customer_phone}</p>
                </div>
                <p className="truncate text-body" style={{ fontSize: "var(--body-sm-size)" }}>{b.service_name}</p>
                <p className="truncate text-body" style={{ fontSize: "var(--body-sm-size)" }}>{b.staff_name}</p>
                <p className="truncate text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.location_name}</p>
                <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
                  style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}>
                  {b.status}
                </p>
              </Link>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="grid gap-xs md:hidden">
            {bookings.map((b) => (
              <Link
                key={b.id}
                href={`/booking/${b.reference_code}`}
                target="_blank"
                className="border border-border bg-card p-md grid gap-xs transition-opacity hover:opacity-70"
              >
                {/* Row 1: time + status */}
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg">
                    {safeFormatTime(b.starts_at)}
                  </p>
                  <span className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
                    style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}>
                    {b.status}
                  </span>
                </div>
                {/* Row 2: client */}
                <div>
                  <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.customer_name}</p>
                  <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>{b.customer_phone}</p>
                </div>
                {/* Row 3: service · stylist · salon */}
                <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>
                  {b.service_name} · {b.staff_name} · {b.location_name}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
