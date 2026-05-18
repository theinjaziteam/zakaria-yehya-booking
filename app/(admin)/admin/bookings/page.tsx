import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { clientConfig } from "@/config/client";
import Link from "next/link";
import { formatDisplayDatetime } from "@/lib/utils/time";

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

const STATUS_COLOR: Record<string, string> = {
  confirmed: "var(--fg)",
  cancelled: "var(--muted-fg)",
  completed: "var(--success)",
  no_show: "var(--warning)",
};

async function getAllBookings(): Promise<BookingRow[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, reference_code, customer_name, customer_phone, customer_email,
        starts_at, status,
        locations!inner(name),
        services!inner(name, price_cents),
        staff!inner(name)
      `)
      .order("starts_at", { ascending: false })
      .limit(200);

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
  return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`;
}

function safeFormatDt(ts: string): string {
  try { return formatDisplayDatetime(ts); } catch { return ts; }
}

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings();

  const labelBase =
    "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  const byStatus = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    no_show: bookings.filter((b) => b.status === "no_show").length,
  };

  return (
    <div>
      <div className="mb-xl grid gap-sm border-b border-border pb-lg">
        <p className={labelBase}>All bookings</p>
        <h1
          className="font-display uppercase text-fg"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)", letterSpacing: "0.05em" }}
        >
          {bookings.length} reservation{bookings.length !== 1 ? "s" : ""}
        </h1>
        <div className="flex flex-wrap gap-xl">
          {Object.entries(byStatus).map(
            ([status, count]) =>
              count > 0 && (
                <div key={status}>
                  <p
                    className="font-display uppercase"
                    style={{
                      fontSize: "var(--display-sm-size)",
                      letterSpacing: "var(--display-sm-tracking)",
                      color: STATUS_COLOR[status],
                    }}
                  >
                    {count}
                  </p>
                  <p className={labelBase}>{status.replace("_", " ")}</p>
                </div>
              ),
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: "56rem" }}>
          <thead>
            <tr className="border-b border-border">
              {[
                "Ref",
                "Date & time",
                "Client",
                "Service",
                "Stylist",
                "Salon",
                "Value",
                "Status",
              ].map((h) => (
                <th key={h} className="pb-xs pr-lg text-left">
                  <span className={labelBase}>{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr
                key={b.id}
                className={i < bookings.length - 1 ? "border-b border-border" : ""}
              >
                <td className="py-sm pr-lg">
                  <Link
                    href={`/booking/${b.reference_code}`}
                    target="_blank"
                    className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-accent hover:opacity-70"
                  >
                    {b.reference_code}
                  </Link>
                </td>
                <td className="py-sm pr-lg">
                  <p
                    className="whitespace-nowrap text-fg"
                    style={{ fontSize: "var(--body-sm-size)" }}
                  >
                    {safeFormatDt(b.starts_at)}
                  </p>
                </td>
                <td className="py-sm pr-lg">
                  <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>
                    {b.customer_name}
                  </p>
                  <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>
                    {b.customer_phone}
                  </p>
                </td>
                <td className="py-sm pr-lg">
                  <p className="text-body" style={{ fontSize: "var(--body-sm-size)" }}>
                    {b.service_name}
                  </p>
                </td>
                <td className="py-sm pr-lg">
                  <p className="text-body" style={{ fontSize: "var(--body-sm-size)" }}>
                    {b.staff_name}
                  </p>
                </td>
                <td className="py-sm pr-lg">
                  <p className="text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>
                    {b.location_name}
                  </p>
                </td>
                <td className="py-sm pr-lg">
                  <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg">
                    {formatPrice(b.service_price_cents)}
                  </p>
                </td>
                <td className="py-sm">
                  <span
                    className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
                    style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
