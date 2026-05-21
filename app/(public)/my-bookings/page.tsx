"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { clientConfig } from "@/config/client";
import { formatDisplayDatetime } from "@/lib/utils/time";
import { displayPhone } from "@/lib/utils/phone";
import { useAuth } from "@/components/auth-provider";

type Booking = {
  booking_id: string;
  reference_code: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  created_at: string;
  location_id: string;
  location_name: string;
  location_address: string;
  location_timezone: string;
  service_id: string;
  service_name: string;
  service_duration_min: number;
  service_price_cents: number;
  staff_id: string;
  staff_name: string;
  staff_title: string | null;
};

type ProductOrder = {
  id: string;
  reference_code: string | null;
  customer_name: string;
  items: { product_name: string; quantity: number; unit_price_cents: number }[];
  total_cents: number;
  status: string;
  pickup_date: string | null;
  pickup_time: string | null;
  created_at: string;
};

type SavedCustomer = {
  name: string;
  email: string;
  phone: string;
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "var(--fg)",
  cancelled: "var(--muted-fg)",
  completed: "var(--success)",
  no_show: "var(--warning)",
};

function formatPrice(cents: number) {
  return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`;
}

function safeFormatDt(ts: string, tz: string): string {
  try {
    return formatDisplayDatetime(ts, tz);
  } catch {
    return ts;
  }
}

const labelBase =
  "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";


export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [customer, setCustomer] = useState<SavedCustomer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [refInput, setRefInput] = useState("");
  const prevEmailRef = useRef<string | null>(null);

  // Auto-load when user session is available (from sign-in at checkout or nav sign-in)
  useEffect(() => {
    if (authLoading) return;

    const sessionEmail = user?.email ?? null;

    // Sign-out detected: was authenticated, now not — reset to blank slate
    if (prevEmailRef.current && !sessionEmail) {
      prevEmailRef.current = null;
      setBookings([]);
      setOrders([]);
      setCustomer(null);
      setFetched(true);
      return;
    }

    prevEmailRef.current = sessionEmail;

    if (sessionEmail) {
      fetchBookings(sessionEmail);
      setCustomer((prev) => prev ?? { name: sessionEmail.split("@")[0], email: sessionEmail, phone: "" });
      return;
    }

    // No session on first load — fall back to localStorage for guest users
    const raw = localStorage.getItem("yz_customer");
    if (raw) {
      try {
        const saved = JSON.parse(raw) as SavedCustomer;
        setCustomer(saved);
        if (saved.email?.includes("@")) {
          fetchBookings(saved.email);
        } else {
          setFetched(true);
        }
      } catch {
        setFetched(true);
      }
    } else {
      setFetched(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email]);

  async function fetchBookings(email: string) {
    setLoading(true);
    try {
      const [bookingRes, orderRes] = await Promise.all([
        fetch(`/api/customer/bookings?email=${encodeURIComponent(email)}`),
        fetch(`/api/customer/orders?email=${encodeURIComponent(email)}`),
      ]);
      if (bookingRes.ok) setBookings((await bookingRes.json()) as Booking[]);
      if (orderRes.ok) setOrders((await orderRes.json()) as ProductOrder[]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.starts_at.replace(" ", "T")) > new Date(),
  );
  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <main className="min-h-screen bg-bg text-body">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b border-border bg-bg/95"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-md sm:px-xl">
          <Link
            href="/"
            className="font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg shrink-0 transition-opacity hover:opacity-70"
          >
            {clientConfig.brand.shortName}
          </Link>
          <p className="hidden sm:block font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
            {clientConfig.brand.name}
          </p>
          <Link
            href="/book"
            className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-muted-fg transition-opacity hover:opacity-70 shrink-0"
          >
            Book →
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-md py-xl sm:px-xl sm:py-xxl">
        {/* Header */}
        <div className="mb-xl grid gap-sm border-b border-border pb-lg">
          <p className={labelBase}>Your reservations</p>
          <h1
            className="font-display uppercase text-fg"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              letterSpacing: "0.05em",
            }}
          >
            {customer ? `${customer.name.split(" ")[0]}'s bookings.` : "Your bookings."}
          </h1>
          {customer?.phone && (
            <p className="text-body whitespace-nowrap" style={{ fontSize: "var(--body-sm-size)" }}>
              {displayPhone(customer.phone)}
            </p>
          )}
        </div>

        {/* Ref code lookup — always visible */}
        <div className="mb-xl max-w-sm">
          <p className={`${labelBase} mb-sm whitespace-nowrap`}>Reservation reference</p>
          <div className="flex gap-sm">
            <input
              type="text"
              value={refInput}
              onChange={(e) =>
                setRefInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="e.g. ABC123"
              maxLength={8}
              className="flex-1 border-b border-input bg-transparent py-sm font-mono text-[length:var(--nav-size)] uppercase tracking-widest text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none"
            />
            <a
              href={refInput.length >= 4 ? `/booking/${refInput}` : undefined}
              onClick={(e) => {
                if (refInput.length < 4) e.preventDefault();
              }}
              className={`shrink-0 inline-flex h-10 items-center justify-center border px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity ${
                refInput.length >= 4
                  ? "border-fg text-fg hover:opacity-70"
                  : "border-border text-muted-fg opacity-50 cursor-default"
              }`}
              style={{ borderRadius: "var(--radius-pill)" }}
            >
              View
            </a>
          </div>
        </div>

        {/* Bookings from localStorage */}
        {loading && (
          <div className="flex items-center gap-sm mb-lg">
            <span className="spinner" style={{ color: "var(--muted-fg)" }} />
            <p className={labelBase}>Loading your bookings…</p>
          </div>
        )}

        {!loading && fetched && customer && (
          <>
            <div className="mb-lg flex items-center justify-between">
              <p className={labelBase}>
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""}{orders.length > 0 ? ` · ${orders.length} order${orders.length !== 1 ? "s" : ""}` : ""}
              </p>
              <button
                onClick={() => {
                  setFetched(false);
                  setBookings([]);
                  setCustomer(null);
                  localStorage.removeItem("yz_customer");
                }}
                className={`${labelBase} transition-opacity hover:opacity-70`}
              >
                Clear saved details
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="border border-border bg-card p-xl text-center">
                <p
                  className="font-display uppercase text-fg"
                  style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
                >
                  No bookings found.
                </p>
                <p className="mt-sm text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>
                  Use a reservation reference above to look up a specific booking.
                </p>
                <Link
                  href="/book"
                  className="mt-md inline-flex h-10 items-center justify-center border border-fg px-6 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg hover:opacity-70"
                  style={{ borderRadius: "var(--radius-pill)" }}
                >
                  Reserve now
                </Link>
              </div>
            ) : (
              <div className="grid gap-xl">
                {/* Product orders — above bookings */}
                {orders.length > 0 && (
                  <section>
                    <p className={`${labelBase} mb-md border-b border-border pb-xs`}>
                      Product orders ({orders.length})
                    </p>
                    <div className="grid gap-sm">
                      {orders.map(o => <OrderCard key={o.id} o={o} />)}
                    </div>
                  </section>
                )}
                {upcoming.length > 0 && (
                  <section>
                    <p className={`${labelBase} mb-md border-b border-border pb-xs`}>
                      Upcoming ({upcoming.length})
                    </p>
                    <div className="grid gap-sm">
                      {upcoming.map((b) => (
                        <BookingCard key={b.booking_id} b={b} showRebook={false} />
                      ))}
                    </div>
                  </section>
                )}
                {past.length > 0 && (
                  <section>
                    <p className={`${labelBase} mb-md border-b border-border pb-xs`}>
                      Past visits ({past.length})
                    </p>
                    <div className="grid gap-sm">
                      {past.map((b) => (
                        <BookingCard key={b.booking_id} b={b} showRebook={b.status !== "cancelled"} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* Not signed in and nothing in localStorage — direct to auth page */}
        {!authLoading && !user && !loading && fetched && !customer && (
          <div className="border border-border bg-card p-md sm:p-lg">
            <p className="font-display uppercase text-fg mb-xs" style={{ fontSize: "clamp(1.1rem, 4vw, 1.4rem)", letterSpacing: "0.04em", lineHeight: 1.2 }}>
              Sign in to view your bookings
            </p>
            <p className="text-muted-fg mb-lg" style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}>
              Your reservations are linked to your account. Sign in or create one to access them here.
            </p>
            <div className="flex flex-wrap gap-sm">
              <Link
                href="/auth?from=/my-bookings"
                className="h-10 inline-flex items-center justify-center px-6 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity hover:opacity-80"
                style={{ borderRadius: "var(--radius-pill)", background: "var(--ink)", color: "var(--canvas)" }}
              >
                Sign in
              </Link>
              <Link
                href="/auth?from=/my-bookings"
                className="h-10 inline-flex items-center justify-center border border-fg px-6 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-colors hover:bg-fg hover:text-canvas"
                style={{ borderRadius: "var(--radius-pill)" }}
              >
                Create account
              </Link>
            </div>
            <p className="mt-md text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>
              No account yet?{" "}
              <Link href="/book" className="text-fg underline-offset-2 hover:opacity-70 underline">
                Make a reservation
              </Link>{" "}
              — your account is created at checkout.
            </p>
          </div>
        )}
      </div>

      <footer className="mt-xl border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-md py-md sm:px-xl">
          <div>
            <p className={labelBase}>{clientConfig.brand.name}</p>
            <p className={labelBase}>Est. 1998</p>
          </div>
          <a href="tel:011780710" className={`${labelBase} shrink-0 hover:opacity-70`}>
            01 780 710
          </a>
        </div>
      </footer>
    </main>
  );
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending:   "var(--warning)",
  confirmed: "var(--fg)",
  completed: "var(--success)",
  cancelled: "var(--muted-fg)",
};

function OrderCard({ o }: { o: ProductOrder }) {
  const cardLabel = "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  function fmtPickup(date: string | null, time: string | null) {
    if (!date) return "—";
    try {
      const d = new Date(date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      return time ? `${d} · ${time.slice(0, 5)}` : d;
    } catch { return date; }
  }

  return (
    <article className={`border border-border bg-card p-md sm:p-lg grid gap-md ${o.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p className="font-display uppercase text-fg" style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}>
            Pickup · {fmtPickup(o.pickup_date, o.pickup_time)}
          </p>
          <p className={cardLabel}>Verdun salon · product order</p>
        </div>
        <span className="shrink-0 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]" style={{ color: ORDER_STATUS_COLOR[o.status] ?? "var(--fg)" }}>
          {o.status}
        </span>
      </div>

      <div className="grid gap-xxs border-t border-border pt-sm sm:grid-cols-3">
        <div>
          <p className={cardLabel}>Items</p>
          {o.items.map((item, i) => (
            <p key={i} className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>
              {item.quantity}× {item.product_name}
            </p>
          ))}
          <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>
            Total: {clientConfig.business.currencySymbol}{(o.total_cents / 100).toFixed(0)}
          </p>
        </div>
        <div>
          <p className={cardLabel}>Reference</p>
          <p className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-accent">
            {o.reference_code ?? "—"}
          </p>
        </div>
      </div>
    </article>
  );
}

function BookingCard({ b, showRebook }: { b: Booking; showRebook: boolean }) {
  const cardLabel =
    "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  const tz = b.location_timezone || clientConfig.business.defaultTimezone;
  const isCancelled = b.status === "cancelled";

  return (
    <article className={`border border-border bg-card p-md sm:p-lg grid gap-md ${isCancelled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
          >
            {safeFormatDt(b.starts_at, tz)}
          </p>
          <p className={cardLabel}>{b.location_name} · {b.location_address}</p>
        </div>
        <span
          className="shrink-0 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
          style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}
        >
          {b.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-xxs border-t border-border pt-sm sm:grid-cols-3">
        <div>
          <p className={cardLabel}>Service</p>
          <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.service_name}</p>
          <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>
            {b.service_duration_min >= 60
              ? `${Math.floor(b.service_duration_min / 60)}h${b.service_duration_min % 60 > 0 ? ` ${b.service_duration_min % 60}m` : ""}`
              : `${b.service_duration_min} min`}{" "}
            · {formatPrice(b.service_price_cents)}
          </p>
        </div>
        <div>
          <p className={cardLabel}>Stylist</p>
          <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.staff_name}</p>
          {b.staff_title && (
            <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>{b.staff_title}</p>
          )}
        </div>
        <div>
          <p className={cardLabel}>Reference</p>
          <Link
            href={`/booking/${b.reference_code}`}
            className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-accent hover:opacity-70"
          >
            {b.reference_code}
          </Link>
        </div>
      </div>

      {showRebook && (
        <div className="flex flex-wrap gap-sm border-t border-border pt-sm">
          <Link
            href={`/book/date?loc=${b.location_id}&svc=${b.service_id}&staff=${b.staff_id}`}
            className="inline-flex h-9 items-center justify-center border border-fg px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-opacity hover:opacity-70"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            Book again
          </Link>
          <Link
            href={`/book/service?loc=${b.location_id}`}
            className="inline-flex h-9 items-center justify-center border border-border px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-muted-fg transition-opacity hover:border-fg hover:text-fg"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            Different service
          </Link>
        </div>
      )}
    </article>
  );
}
