export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";
import { RefreshButton } from "@/components/admin/refresh-button";

const TZ = "Asia/Beirut";

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }
function fmtDate(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00")), TZ, "EEE d MMM · HH:mm"); } catch { return ts; }
}

type MonthBucket = { month: string; booking_revenue: number; order_revenue: number; booking_count: number };
type StaffRow = { id: string; name: string; booking_count: number; revenue_cents: number };
type BookingRow = {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  status: string;
  service_name: string;
  price_cents: number;
  staff_id: string;
};

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const selectedStaffId = sp.staff ?? null;

  const supabase = createAdminSupabaseClient();

  // ── All confirmed bookings with service price ────────────────
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select("id, reference_code, customer_name, customer_phone, starts_at, status, staff_id, services(name, price_cents)")
    .in("status", ["confirmed", "completed"])
    .order("starts_at", { ascending: false });

  // ── All product orders ────────────────────────────────────────
  const { data: ordersRaw } = await supabase
    .from("product_orders")
    .select("id, total_cents, created_at, status")
    .in("status", ["pending", "confirmed", "completed"])
    .order("created_at", { ascending: false });

  // ── Staff list ───────────────────────────────────────────────
  const { data: staffRaw } = await supabase
    .from("staff")
    .select("id, name")
    .eq("active", true)
    .order("sort_order");

  const bookings: BookingRow[] = (bookingsRaw ?? []).map((r: Record<string, unknown>) => {
    const svc = (r.services as Record<string, unknown> | null) ?? {};
    return {
      id: String(r.id),
      reference_code: String(r.reference_code),
      customer_name: String(r.customer_name),
      customer_phone: String(r.customer_phone),
      starts_at: String(r.starts_at),
      status: String(r.status),
      service_name: String(svc.name ?? "—"),
      price_cents: Number(svc.price_cents ?? 0),
      staff_id: String(r.staff_id),
    };
  });

  // ── Monthly buckets ──────────────────────────────────────────
  const monthMap = new Map<string, MonthBucket>();

  for (const b of bookings) {
    const month = formatInTimeZone(
      new Date(b.starts_at.replace(" ", "T").replace(/\+00$/, "+00:00")),
      TZ, "yyyy-MM"
    );
    const bucket = monthMap.get(month) ?? { month, booking_revenue: 0, order_revenue: 0, booking_count: 0 };
    bucket.booking_revenue += b.price_cents;
    bucket.booking_count += 1;
    monthMap.set(month, bucket);
  }
  for (const o of (ordersRaw ?? [])) {
    const month = formatInTimeZone(new Date(String(o.created_at)), TZ, "yyyy-MM");
    const bucket = monthMap.get(month) ?? { month, booking_revenue: 0, order_revenue: 0, booking_count: 0 };
    bucket.order_revenue += Number(o.total_cents ?? 0);
    monthMap.set(month, bucket);
  }
  const months: MonthBucket[] = Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));

  // ── Per-staff stats ──────────────────────────────────────────
  const staffStats = new Map<string, StaffRow>();
  for (const s of (staffRaw ?? [])) {
    staffStats.set(String(s.id), { id: String(s.id), name: String(s.name), booking_count: 0, revenue_cents: 0 });
  }
  for (const b of bookings) {
    const row = staffStats.get(b.staff_id);
    if (row) { row.booking_count += 1; row.revenue_cents += b.price_cents; }
  }
  const staffList: StaffRow[] = Array.from(staffStats.values()).sort((a, b) => b.revenue_cents - a.revenue_cents);

  // ── Grand totals ─────────────────────────────────────────────
  const totalBookingRevenue = bookings.reduce((s, b) => s + b.price_cents, 0);
  const totalOrderRevenue = (ordersRaw ?? []).reduce((s, o) => s + Number(o.total_cents ?? 0), 0);
  const grandTotal = totalBookingRevenue + totalOrderRevenue;

  // ── Bookings for selected staff ──────────────────────────────
  const staffBookings = selectedStaffId
    ? bookings.filter(b => b.staff_id === selectedStaffId)
    : [];
  const selectedStaff = selectedStaffId ? staffStats.get(selectedStaffId) : null;

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg";

  return (
    <div>
      {/* Header */}
      <div className="mb-8 border-b border-border pb-6 flex items-start justify-between gap-4">
        <div>
          <p className={`${label} mb-1`}>Admin · Revenue</p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Revenue</h1>
        </div>
        <RefreshButton />
      </div>

      {/* Grand totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total revenue", value: fmt(grandTotal) },
          { label: "From bookings", value: fmt(totalBookingRevenue) },
          { label: "From orders", value: fmt(totalOrderRevenue) },
          { label: "Bookings", value: String(bookings.length) },
        ].map(s => (
          <div key={s.label} className="border border-border bg-card p-4">
            <p className={`${label} mb-2`}>{s.label}</p>
            <p className="font-display text-3xl uppercase tracking-wide text-fg">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Monthly breakdown */}
        <div>
          <p className={`${label} mb-4`}>Revenue by month</p>
          {months.length === 0 ? (
            <p className={label}>No revenue yet.</p>
          ) : (
            <div className="border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Month", "Bookings", "Orders", "Total"].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted-fg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => {
                    const total = m.booking_revenue + m.order_revenue;
                    return (
                      <tr key={m.month} className={i < months.length - 1 ? "border-b border-border" : ""}>
                        <td className="px-4 py-3 font-mono text-sm text-fg">{m.month}</td>
                        <td className="px-4 py-3 font-mono text-sm text-fg">
                          {fmt(m.booking_revenue)}
                          <span className="ml-1 text-muted-fg text-xs">({m.booking_count})</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-fg">{fmt(m.order_revenue)}</td>
                        <td className="px-4 py-3 font-mono text-sm font-medium text-fg">{fmt(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-staff stats */}
        <div>
          <p className={`${label} mb-4`}>Staff performance</p>
          {staffList.filter(s => s.booking_count > 0).length === 0 ? (
            <p className={label}>No bookings yet.</p>
          ) : (
            <div className="border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Stylist", "Bookings", "Revenue", ""].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted-fg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s, i) => (
                    <tr key={s.id} className={i < staffList.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 font-medium text-fg">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-fg">{s.booking_count}</td>
                      <td className="px-4 py-3 font-mono text-sm text-fg">{fmt(s.revenue_cents)}</td>
                      <td className="px-4 py-3">
                        {s.booking_count > 0 && (
                          <a
                            href={`/admin/revenue?staff=${s.id}`}
                            className="font-mono text-xs uppercase tracking-widest text-accent hover:opacity-70"
                          >
                            View →
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Staff booking detail */}
      {selectedStaff && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className={label}>{selectedStaff.name} — all bookings ({staffBookings.length})</p>
            <a href="/admin/revenue" className="font-mono text-xs uppercase tracking-widest text-muted-fg hover:text-fg">
              ← All staff
            </a>
          </div>
          {staffBookings.length === 0 ? (
            <p className={label}>No bookings.</p>
          ) : (
            <div className="border border-border overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Ref", "Client", "Service", "Value", "Status"].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-mono text-xs uppercase tracking-widest text-muted-fg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffBookings.map((b, i) => (
                    <tr key={b.id} className={i < staffBookings.length - 1 ? "border-b border-border" : ""}>
                      <td className="px-4 py-3 font-mono text-xs text-fg whitespace-nowrap">{fmtDate(b.starts_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-accent">{b.reference_code}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-fg">{b.customer_name}</p>
                        <p className="text-xs text-muted-fg">{b.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-fg">{b.service_name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-fg">{fmt(b.price_cents)}</td>
                      <td className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-fg">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={4} className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-fg">Total</td>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-fg">{fmt(selectedStaff.revenue_cents)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
