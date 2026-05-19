export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Beirut";

type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  items: OrderItem[];
  total_cents: number;
  status: string;
  notes: string | null;
  created_at: string;
};

async function getOrders(): Promise<{ rows: OrderRow[]; dbError: string | null }> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("product_orders")
      .select("id, customer_name, customer_phone, customer_email, items, total_cents, status, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("admin getOrders error:", error.message);
      return { rows: [], dbError: error.message };
    }

    return { rows: (data as OrderRow[] | null) ?? [], dbError: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("admin getOrders exception:", msg);
    return { rows: [], dbError: msg };
  }
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDt(ts: string) {
  try {
    return formatInTimeZone(new Date(ts), TZ, "EEE d MMM · HH:mm");
  } catch {
    return ts;
  }
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending: { color: "var(--warning)" },
  confirmed: { color: "var(--fg)" },
  completed: { color: "var(--success)" },
  cancelled: { color: "var(--muted-fg)" },
};

export default async function AdminOrdersPage() {
  const { rows: orders, dbError } = await getOrders();

  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <div>
      {dbError && (
        <div className="mb-6 border border-warning bg-card px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-warning">
            Database error — check SUPABASE_SERVICE_ROLE_KEY and run migrations.
          </p>
          <p className="mt-1 font-mono text-xs text-muted-fg">{dbError}</p>
        </div>
      )}

      <div className="mb-8 border-b border-border pb-6">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted-fg">
          Admin · Product Orders
        </p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Orders</h1>
        <div className="mt-3 flex flex-wrap gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-fg">
            {orders.length} total
          </span>
          {pending > 0 && (
            <span className="font-mono text-xs uppercase tracking-widest text-warning">
              {pending} pending
            </span>
          )}
        </div>
      </div>

      {orders.length === 0 && !dbError ? (
        <p className="font-mono text-sm uppercase tracking-widest text-muted-fg">No orders yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Customer", "Phone", "Email", "Items", "Total", "Status", "Notes"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-6 text-left font-mono text-xs uppercase tracking-widest text-muted-fg"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="py-3 pr-6 font-mono text-xs text-muted-fg whitespace-nowrap">
                      {formatDt(order.created_at)}
                    </td>
                    <td className="py-3 pr-6 font-mono text-xs text-fg whitespace-nowrap">
                      {order.customer_name}
                    </td>
                    <td className="py-3 pr-6 font-mono text-xs text-muted-fg whitespace-nowrap">
                      {order.customer_phone}
                    </td>
                    <td className="py-3 pr-6 font-mono text-xs text-muted-fg whitespace-nowrap">
                      {order.customer_email}
                    </td>
                    <td className="py-3 pr-6 font-mono text-xs text-fg">
                      {order.items.map((item) => (
                        <div key={item.product_id} className="whitespace-nowrap">
                          {item.quantity}× {item.product_name}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 pr-6 font-mono text-xs text-fg whitespace-nowrap">
                      {formatPrice(order.total_cents)}
                    </td>
                    <td
                      className="py-3 pr-6 font-mono text-xs uppercase tracking-widest whitespace-nowrap"
                      style={STATUS_STYLE[order.status] ?? {}}
                    >
                      {order.status}
                    </td>
                    <td className="py-3 pr-6 text-xs text-muted-fg max-w-[12rem] truncate">
                      {order.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-sm lg:hidden">
            {orders.map((order) => (
              <div key={order.id} className="border border-border bg-card p-4 grid gap-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-fg">{order.customer_name}</p>
                    <p className="font-mono text-xs text-muted-fg">{order.customer_phone}</p>
                    <p className="font-mono text-xs text-muted-fg">{order.customer_email}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-mono text-xs uppercase tracking-widest"
                      style={STATUS_STYLE[order.status] ?? {}}
                    >
                      {order.status}
                    </p>
                    <p className="font-mono text-xs text-fg">{formatPrice(order.total_cents)}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-xs">
                  {order.items.map((item) => (
                    <p key={item.product_id} className="font-mono text-xs text-muted-fg">
                      {item.quantity}× {item.product_name} · {formatPrice(item.unit_price_cents)}
                    </p>
                  ))}
                </div>
                <p className="font-mono text-xs text-muted-fg">{formatDt(order.created_at)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
