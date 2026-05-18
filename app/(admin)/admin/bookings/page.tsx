import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { clientConfig } from "@/config/client";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { CancelBookingButton } from "@/components/admin/cancel-booking-button";

const TZ = clientConfig.business.defaultTimezone;

type BookingRow = { id: string; reference_code: string; customer_name: string; customer_phone: string; customer_email: string | null; starts_at: string; status: string; location_name: string; service_name: string; service_price_cents: number; staff_name: string; };

const STATUS_COLOR: Record<string, string> = { confirmed: "var(--fg)", cancelled: "var(--muted-fg)", completed: "var(--success)", no_show: "var(--warning)" };

async function getBookings(view: "today" | "all"): Promise<BookingRow[]> {
  try {
    const supabase = createAdminSupabaseClient();
    let query = supabase.from("bookings").select(`id, reference_code, customer_name, customer_phone, customer_email, starts_at, status, locations!inner(name), services!inner(name, price_cents), staff!inner(name)`).order("starts_at", { ascending: view === "today" }).limit(200);
    if (view === "today") {
      const now = new Date();
      const todayBeirut = formatInTimeZone(now, TZ, "yyyy-MM-dd");
      const { fromZonedTime } = await import("date-fns-tz");
      const startISO = fromZonedTime(new Date(`${todayBeirut}T00:00:00`), TZ).toISOString();
      const endISO = fromZonedTime(new Date(`${todayBeirut}T23:59:59`), TZ).toISOString();
      query = query.gte("starts_at", startISO).lte("starts_at", endISO);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as unknown[]).map((r: unknown) => {
      const row = r as Record<string, unknown>;
      const loc = (row.locations as Record<string, unknown>) ?? {};
      const svc = (row.services as Record<string, unknown>) ?? {};
      const stf = (row.staff as Record<string, unknown>) ?? {};
      return { id: String(row.id ?? ""), reference_code: String(row.reference_code ?? ""), customer_name: String(row.customer_name ?? ""), customer_phone: String(row.customer_phone ?? ""), customer_email: (row.customer_email as string | null) ?? null, starts_at: String(row.starts_at ?? ""), status: String(row.status ?? "confirmed"), location_name: String(loc.name ?? "—"), service_name: String(svc.name ?? "—"), service_price_cents: Number(svc.price_cents ?? 0), staff_name: String(stf.name ?? "—") };
    });
  } catch { return []; }
}

function formatPrice(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

function safeFormatDt(ts: string): string {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00")), TZ, "EEE d MMM · HH:mm"); } catch { return ts; }
}
function safeFormatTime(ts: string): string {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00")), TZ, "HH:mm"); } catch { return "—"; }
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const view = sp.view === "today" ? "today" : "all";
  const bookings = await getBookings(view);
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Bookings</h1>
          <div className="mt-3 flex gap-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-fg">{bookings.length} total</span>
            <span className="font-mono text-xs uppercase tracking-widest text-fg">{confirmed} confirmed</span>
            {cancelled > 0 && <span className="font-mono text-xs uppercase tracking-widest text-muted-fg">{cancelled} cancelled</span>}
          </div>
        </div>
        <div className="flex border border-border">
          <Link href="/admin/bookings?view=today" className={`px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${view === "today" ? "bg-fg text-bg" : "text-muted-fg hover:text-fg"}`}>Today</Link>
          <Link href="/admin/bookings?view=all" className={`px-5 py-2 font-mono text-xs uppercase tracking-widest transition-colors border-l border-border ${view === "all" ? "bg-fg text-bg" : "text-muted-fg hover:text-fg"}`}>All</Link>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center">
          <p className="font-display text-xl uppercase tracking-wide text-fg">{view === "today" ? "No appointments today." : "No bookings yet."}</p>
          <p className="mt-2 text-sm text-muted-fg">{view === "today" ? "Bookings for today will appear here." : "Bookings will appear here once made."}</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Ref", "Client", "Service", "Stylist", "Salon", "Value", "Status", ""].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-left font-mono text-xs uppercase tracking-widest text-muted-fg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.id} className={i < bookings.length - 1 ? "border-b border-border" : ""}>
                    <td className="py-3 pr-4 font-mono text-sm text-fg whitespace-nowrap">{view === "today" ? safeFormatTime(b.starts_at) : safeFormatDt(b.starts_at)}</td>
                    <td className="py-3 pr-4"><Link href={`/booking/${b.reference_code}`} target="_blank" className="font-mono text-xs uppercase tracking-widest text-accent hover:opacity-70">{b.reference_code}</Link></td>
                    <td className="py-3 pr-4"><p className="text-fg font-medium">{b.customer_name}</p><p className="text-muted-fg text-xs">{b.customer_phone}</p></td>
                    <td className="py-3 pr-4 text-fg">{b.service_name}</td>
                    <td className="py-3 pr-4 text-fg">{b.staff_name}</td>
                    <td className="py-3 pr-4 text-muted-fg">{b.location_name}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-fg">{formatPrice(b.service_price_cents)}</td>
                    <td className="py-3 pr-4"><span className="font-mono text-xs uppercase tracking-widest" style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}>{b.status.replace("_", " ")}</span></td>
                    <td className="py-3">{b.status === "confirmed" && <CancelBookingButton refCode={b.reference_code} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {bookings.map((b) => (
              <div key={b.id} className="border border-border bg-card p-4 grid gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-base text-fg font-medium">{view === "today" ? safeFormatTime(b.starts_at) : safeFormatDt(b.starts_at)}</p>
                    <Link href={`/booking/${b.reference_code}`} target="_blank" className="font-mono text-xs uppercase tracking-widest text-accent">{b.reference_code}</Link>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest" style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}>{b.status.replace("_", " ")}</span>
                </div>
                <div><p className="text-fg font-medium text-base">{b.customer_name}</p><p className="text-muted-fg text-sm">{b.customer_phone}</p></div>
                <p className="text-sm text-muted-fg">{b.service_name} · {b.staff_name} · {b.location_name} · {formatPrice(b.service_price_cents)}</p>
                {b.status === "confirmed" && <CancelBookingButton refCode={b.reference_code} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
