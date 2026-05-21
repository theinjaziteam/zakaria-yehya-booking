export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";
import { FulfillOrderButton } from "@/components/admin/fulfill-order-button";
import { CancelOrderButton } from "@/components/admin/cancel-order-button";
import { LogSaleForm } from "@/components/admin/log-sale-form";

const TZ = "Asia/Beirut";

type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
};

type OrderRow = {
  id: string;
  reference_code: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItem[];
  total_cents: number;
  status: string;
  notes: string | null;
  pickup_date: string | null;
  pickup_time: string | null;
  created_at: string;
};

type Product = { id: string; name: string; price_cents: number };

// Auto-fulfill orders whose pickup time has passed
async function autoFulfillPast(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  const nowBeirut = formatInTimeZone(new Date(), TZ, "yyyy-MM-dd HH:mm");
  const [todayDate, todayTime] = nowBeirut.split(" ");
  await supabase
    .from("product_orders")
    .update({ status: "completed" })
    .eq("status", "pending")
    .or(
      `pickup_date.lt.${todayDate},and(pickup_date.eq.${todayDate},pickup_time.lte.${todayTime}:00)`,
    );
}

async function getOrders(): Promise<{ rows: OrderRow[]; dbError: string | null }> {
  try {
    const supabase = createAdminSupabaseClient();
    await autoFulfillPast(supabase);

    const { data, error } = await supabase
      .from("product_orders")
      .select("id, reference_code, customer_name, customer_phone, customer_email, items, total_cents, status, notes, pickup_date, pickup_time, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return { rows: [], dbError: error.message };
    return { rows: (data as OrderRow[] | null) ?? [], dbError: null };
  } catch (e) {
    return { rows: [], dbError: e instanceof Error ? e.message : String(e) };
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("products").select("id, name, price_cents").eq("active", true).order("sort_order");
    return (data as Product[] | null) ?? [];
  } catch { return []; }
}

function formatPrice(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

function formatDt(ts: string) {
  try { return formatInTimeZone(new Date(ts), TZ, "EEE d MMM · HH:mm"); } catch { return ts; }
}

function formatPickup(date: string | null, time: string | null) {
  if (!date) return "—";
  try {
    const d = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return time ? `${d} · ${time.slice(0, 5)}` : d;
  } catch { return date; }
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending: { color: "var(--warning)" },
  confirmed: { color: "var(--fg)" },
  completed: { color: "var(--success)" },
  cancelled: { color: "var(--muted-fg)" },
};

export default async function AdminOrdersPage() {
  const [{ rows: orders, dbError }, products] = await Promise.all([getOrders(), getProducts()]);
  const pending = orders.filter(o => o.status === "pending").length;

  return (
    <div>
      {dbError && (
        <div className="mb-5 border border-warning bg-card px-4 py-3">
          <p className="font-mono text-sm uppercase tracking-widest text-warning">Database error</p>
          <p className="mt-1 font-mono text-sm text-muted-fg">{dbError}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-5 border-b border-border pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-4xl uppercase tracking-wide text-fg">Orders</h1>
            <div className="mt-1 flex flex-wrap gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-fg">{orders.length} total</span>
              {pending > 0 && <span className="font-mono text-xs uppercase tracking-widest text-warning">{pending} pending</span>}
            </div>
          </div>
          <LogSaleForm products={products} />
        </div>
      </div>

      {orders.length === 0 && !dbError ? (
        <p className="font-mono text-sm uppercase tracking-widest text-muted-fg">No orders yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-border">
                  {["Ref", "Placed", "Customer", "Items", "Total", "Pickup", "Status", ""].map(h => (
                    <th key={h} className="pb-3 pr-5 text-left font-mono text-sm uppercase tracking-widest text-muted-fg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-3.5 pr-5 font-mono text-sm text-accent">{order.reference_code ?? "—"}</td>
                    <td className="py-3.5 pr-5 font-mono text-sm text-muted-fg whitespace-nowrap">{formatDt(order.created_at)}</td>
                    <td className="py-3.5 pr-5">
                      <p className="text-base text-fg">{order.customer_name}</p>
                      <p className="font-mono text-xs text-muted-fg">{order.customer_phone}</p>
                    </td>
                    <td className="py-3.5 pr-5 text-sm text-fg">
                      {order.items.map(item => (
                        <div key={item.product_id} className="whitespace-nowrap">{item.quantity}× {item.product_name}</div>
                      ))}
                    </td>
                    <td className="py-3.5 pr-5 font-mono text-base text-fg">{formatPrice(order.total_cents)}</td>
                    <td className="py-3.5 pr-5 font-mono text-sm text-fg whitespace-nowrap">{formatPickup(order.pickup_date, order.pickup_time)}</td>
                    <td className="py-3.5 pr-5 font-mono text-sm uppercase tracking-widest whitespace-nowrap" style={STATUS_STYLE[order.status] ?? {}}>
                      {order.status}
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col gap-1">
                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <FulfillOrderButton orderId={order.id} />
                        )}
                        {order.status !== "cancelled" && (
                          <CancelOrderButton orderId={order.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-2 lg:hidden">
            {orders.map(order => (
              <div key={order.id} className="border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-base text-fg">{order.customer_name}</p>
                    <p className="font-mono text-xs text-muted-fg">{order.customer_phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs uppercase tracking-widest" style={STATUS_STYLE[order.status] ?? {}}>{order.status}</p>
                    <p className="font-mono text-sm text-fg">{formatPrice(order.total_cents)}</p>
                  </div>
                </div>
                <div className="mb-2">
                  {order.items.map(item => (
                    <p key={item.product_id} className="text-sm text-muted-fg">{item.quantity}× {item.product_name}</p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-fg mb-2">
                  {order.reference_code && <span className="text-accent">{order.reference_code}</span>}
                  <span>{formatPickup(order.pickup_date, order.pickup_time)}</span>
                </div>
                <div className="flex gap-2">
                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <FulfillOrderButton orderId={order.id} />
                  )}
                  {order.status !== "cancelled" && (
                    <CancelOrderButton orderId={order.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
