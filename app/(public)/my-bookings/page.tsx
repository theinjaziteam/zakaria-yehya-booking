"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clientConfig } from "@/config/client";
import { formatDisplayDatetime } from "@/lib/utils/time";
import { displayPhone } from "@/lib/utils/phone";

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

function rebookUrl(b: Booking): string {
  return `/book/date?loc=${b.location_id}&svc=${b.service_id}&staff=${b.staff_id}`;
}

const labelBase =
  "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

export default function MyBookingsPage() {
  const [customer, setCustomer] = useState<SavedCustomer | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [refInput, setRefInput] = useState("");

  // Load saved customer from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("yz_customer");
    if (raw) {
      try {
        const saved = JSON.parse(raw) as SavedCustomer;
        setCustomer(saved);
        setEmailInput(saved.email);
        fetchBookings(saved.email);
      } catch {
        /* ignore */
      }
    }
  }, []);

  async function fetchBookings(email: string) {
    if (!email.includes("@")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/customer/bookings?email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) {
        setError("Could not load bookings. Please try again.");
        return;
      }
      const data = (await res.json()) as Booking[];
      setBookings(data);
      setFetched(true);
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    fetchBookings(emailInput.trim());
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
            className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg hover:opacity-70 shrink-0"
          >
            {clientConfig.brand.shortName}
          </Link>
          <p className="hidden sm:block font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
            {clientConfig.brand.name}
          </p>
          <Link
            href="/book"
            className="inline-flex h-9 items-center justify-center border border-fg px-4 sm:px-6 font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg hover:opacity-70 shrink-0"
            style={{ borderRadius: "var(--radius-pill)" }}
          >
            Reserve
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-md py-xl sm:px-xl sm:py-xxl">
        {/* Header */}
        <div className="mb-xl grid gap-sm border-b border-border pb-lg">
          <p className={labelBase}>Your account</p>
          <h1
            className="font-display uppercase text-fg"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              letterSpacing: "0.05em",
            }}
          >
            Booking history.
          </h1>
          {customer && (
            <p className="text-body" style={{ fontSize: "var(--body-sm-size)" }}>
              {customer.name}
              {customer.phone ? ` · ${displayPhone(customer.phone)}` : ""}
            </p>
          )}
        </div>

        {/* Lookup options */}
        {!fetched && (
          <div className="mb-xl grid gap-xl max-w-md">
            {/* Ref code lookup */}
            <div>
              <p className={`${labelBase} mb-sm`}>Find by reservation reference</p>
              <div className="flex gap-sm">
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="e.g. ABC123"
                  maxLength={8}
                  className="flex-1 border-b border-input bg-transparent py-sm font-mono text-[length:var(--nav-size)] uppercase tracking-widest text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none"
                />
                <a
                  href={refInput.length >= 4 ? `/booking/${refInput}` : undefined}
                  onClick={(e) => { if (refInput.length < 4) e.preventDefault(); }}
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

            <div className="flex items-center gap-md">
              <div className="flex-1 border-t border-border" />
              <p className={labelBase}>or look up by email</p>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Email lookup */}
            <form onSubmit={handleLookup}>
              <p className={`${labelBase} mb-sm`}>View all bookings for your email</p>
              <div className="flex gap-sm">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 border-b border-input bg-transparent py-sm font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="shrink-0 inline-flex h-10 items-center justify-center border border-fg px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-opacity disabled:opacity-50 hover:opacity-70"
                  style={{ borderRadius: "var(--radius-pill)" }}
                >
                  {loading ? "…" : "Look up"}
                </button>
              </div>
              {error && (
                <p className="mt-sm font-mono text-[10px] uppercase tracking-widest text-warning">
                  {error}
                </p>
              )}
            </form>
          </div>
        )}

        {fetched && (
          <>
            {/* Switch account */}
            <div className="mb-lg flex items-center justify-between">
              <p className={labelBase}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} found for {emailInput}</p>
              <button
                onClick={() => {
                  setFetched(false);
                  setBookings([]);
                  setEmailInput("");
                  setCustomer(null);
                  localStorage.removeItem("yz_customer");
                }}
                className={`${labelBase} transition-opacity hover:opacity-70`}
              >
                Change email
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
                  Make sure you used the same email when booking.
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
                {/* Upcoming */}
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

                {/* Past */}
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
      </div>

      <footer className="mt-xl border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-md py-md sm:px-xl">
          <p className={labelBase}>{clientConfig.brand.name} · Est. 1998</p>
          <Link href="/" className={`${labelBase} hover:opacity-70`}>
            Home →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function BookingCard({ b, showRebook }: { b: Booking; showRebook: boolean }) {
  const labelBase =
    "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

  const tz = b.location_timezone || clientConfig.business.defaultTimezone;
  const isCancelled = b.status === "cancelled";

  return (
    <article className={`border border-border bg-card p-md sm:p-lg grid gap-md ${isCancelled ? "opacity-60" : ""}`}>
      {/* Top row: date + status */}
      <div className="flex items-start justify-between gap-sm">
        <div>
          <p
            className="font-display uppercase text-fg"
            style={{ fontSize: "var(--title-md-size)", letterSpacing: "var(--title-md-tracking)" }}
          >
            {safeFormatDt(b.starts_at, tz)}
          </p>
          <p className={labelBase}>{b.location_name} · {b.location_address}</p>
        </div>
        <span
          className="shrink-0 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
          style={{ color: STATUS_COLOR[b.status] ?? "var(--fg)" }}
        >
          {b.status.replace("_", " ")}
        </span>
      </div>

      {/* Service + stylist */}
      <div className="grid gap-xxs border-t border-border pt-sm sm:grid-cols-3">
        <div>
          <p className={labelBase}>Service</p>
          <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.service_name}</p>
          <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>
            {b.service_duration_min >= 60
              ? `${Math.floor(b.service_duration_min / 60)}h${b.service_duration_min % 60 > 0 ? ` ${b.service_duration_min % 60}m` : ""}`
              : `${b.service_duration_min} min`}{" "}
            · {clientConfig.business.currencySymbol}{(b.service_price_cents / 100).toFixed(0)}
          </p>
        </div>
        <div>
          <p className={labelBase}>Stylist</p>
          <p className="text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{b.staff_name}</p>
          {b.staff_title && (
            <p className="text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>{b.staff_title}</p>
          )}
        </div>
        <div>
          <p className={labelBase}>Reference</p>
          <Link
            href={`/booking/${b.reference_code}`}
            className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-accent hover:opacity-70"
          >
            {b.reference_code}
          </Link>
        </div>
      </div>

      {/* Actions */}
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
