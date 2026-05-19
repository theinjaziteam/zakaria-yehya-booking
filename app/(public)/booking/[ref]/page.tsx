"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { clientConfig } from "@/config/client";
import { formatDisplayDatetime } from "@/lib/utils/time";
import { displayPhone } from "@/lib/utils/phone";

// The RPC may return nested objects OR flat prefixed columns — accept both.
type RawBooking = Record<string, unknown>;

type BookingView = {
  reference_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  // location
  location_name: string;
  location_address: string;
  location_timezone: string;
  location_phone: string | null;
  // service
  service_name: string;
  service_duration_min: number;
  service_price_cents: number;
  // staff
  staff_name: string;
  staff_title: string | null;
};

/** Normalise flat OR nested RPC response into BookingView */
function normalise(raw: RawBooking): BookingView {
  const loc = (raw.location ?? {}) as Record<string, unknown>;
  const svc = (raw.service ?? {}) as Record<string, unknown>;
  const stf = (raw.staff ?? {}) as Record<string, unknown>;

  return {
    reference_code: String(raw.reference_code ?? ""),
    customer_name: String(raw.customer_name ?? ""),
    customer_phone: String(raw.customer_phone ?? ""),
    customer_email: (raw.customer_email as string | null) ?? null,
    starts_at: String(raw.starts_at ?? ""),
    ends_at: String(raw.ends_at ?? ""),
    status: String(raw.status ?? "confirmed"),
    notes: (raw.notes as string | null) ?? null,
    // location — try nested first, then flat prefixed
    location_name: String(loc.name ?? raw.location_name ?? "—"),
    location_address: String(loc.address ?? raw.location_address ?? "—"),
    location_timezone: String(
      loc.timezone ?? raw.location_timezone ?? clientConfig.business.defaultTimezone,
    ),
    location_phone: (loc.phone ?? raw.location_phone ?? null) as string | null,
    // service
    service_name: String(svc.name ?? raw.service_name ?? "—"),
    service_duration_min: Number(svc.duration_min ?? raw.service_duration_min ?? 0),
    service_price_cents: Number(svc.price_cents ?? raw.service_price_cents ?? 0),
    // staff
    staff_name: String(stf.name ?? raw.staff_name ?? "—"),
    staff_title: (stf.title ?? raw.staff_title ?? null) as string | null,
  };
}

function formatPrice(cents: number) {
  return `${clientConfig.business.currencySymbol}${(cents / 100).toFixed(0)}`;
}

function formatDur(min: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return min > 0 ? `${min} min` : "";
}

function mapsLink(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

function parseTs(ts: string): Date {
  return new Date(ts.replace(" ", "T").replace(/\+00$/, "+00:00"));
}

function googleCalLink(b: BookingView) {
  const fmt = (d: string) =>
    parseTs(d).toISOString().replace(/[-:]/g, "").replace(".000", "");
  const title = encodeURIComponent(
    `${b.service_name} @ ${b.location_name} — ${clientConfig.brand.name}`,
  );
  const details = encodeURIComponent(
    `Reference: ${b.reference_code}\nStylist: ${b.staff_name}`,
  );
  const loc = encodeURIComponent(b.location_address);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(b.starts_at)}/${fmt(b.ends_at)}&details=${details}&location=${loc}`;
}

function whatsappLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// ── Cancel dialog ─────────────────────────────

function CancelDialog({
  bookingRef,
  onCancelled,
  onClose,
}: {
  bookingRef: string;
  onCancelled: () => void;
  onClose: () => void;
}) {
  const [last4, setLast4] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (last4.length !== 4) {
      setError("Please enter exactly 4 digits.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingRef}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneLast4: last4 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Cancellation failed.");
      } else {
        onCancelled();
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-md"
      style={{ background: "rgba(0,0,0,0.82)" }}
    >
      <div
        className="w-full border border-border bg-bg p-lg"
        style={{ maxWidth: "24rem" }}
      >
        <p
          className="mb-sm font-display uppercase text-fg"
          style={{
            fontSize: "var(--title-md-size)",
            letterSpacing: "var(--title-md-tracking)",
          }}
        >
          Cancel reservation
        </p>
        <p
          className="mb-md text-body"
          style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}
        >
          Enter the last 4 digits of the phone number used when booking.
        </p>
        <input
          type="tel"
          maxLength={4}
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
          placeholder="0000"
          className="mb-md w-full border-b border-input bg-transparent py-sm text-center font-mono text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none"
          style={{
            fontSize: "var(--title-md-size)",
            letterSpacing: "0.3em",
          }}
        />
        {error && (
          <p className="mb-sm font-mono text-[10px] uppercase tracking-widest text-warning">
            {error}
          </p>
        )}
        <div className="flex gap-sm">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 border border-warning py-sm font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-warning transition-opacity disabled:opacity-50 hover:opacity-80"
          >
            {loading ? "Cancelling…" : "Confirm cancel"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-border py-sm font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-muted-fg transition-opacity hover:opacity-70"
          >
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────

const labelBase =
  "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";

export default function BookingReferencePage() {
  const params = useParams<{ ref: string }>();
  const refCode = (params.ref ?? "").toUpperCase();

  const [booking, setBooking] = useState<BookingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!refCode) return;
    fetch(`/api/bookings/${refCode}`)
      .then(async (res) => {
        if (!res.ok) {
          setFetchError(
            "Reservation not found. Please check your reference code.",
          );
          return;
        }
        const raw = (await res.json()) as RawBooking;
        const view = normalise(raw);
        setBooking(view);
        if (view.status === "cancelled") setCancelled(true);
      })
      .catch(() =>
        setFetchError("Could not load reservation. Please try again."),
      )
      .finally(() => setLoading(false));
  }, [refCode]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg">
        <p className={labelBase}>Loading reservation…</p>
      </main>
    );
  }

  if (fetchError || !booking) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-bg px-md text-center">
        <p
          className="font-display uppercase text-fg"
          style={{
            fontSize: "var(--display-sm-size)",
            letterSpacing: "var(--display-sm-tracking)",
          }}
        >
          Reservation not found.
        </p>
        <p className={labelBase}>
          {fetchError ?? "Please check the reference code."}
        </p>
        <Link
          href="/book"
          className="mt-sm inline-flex h-11 items-center justify-center border border-fg px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg hover:opacity-70"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          Make a new reservation
        </Link>
      </main>
    );
  }

  const tz = booking.location_timezone;
  const whatsappMsg = `✂️ Reservation confirmed — ${clientConfig.brand.name}\n\nRef: ${booking.reference_code}\nDate: ${formatDisplayDatetime(booking.starts_at, tz)}\nSalon: ${booking.location_name}\nService: ${booking.service_name}\nStylist: ${booking.staff_name}\nTotal: ${formatPrice(booking.service_price_cents)}\n\n${booking.location_address}`;

  const detailRows = [
    { label: "Salon", value: booking.location_name },
    {
      label: "Stylist",
      value: booking.staff_title
        ? `${booking.staff_name} · ${booking.staff_title}`
        : booking.staff_name,
    },
    {
      label: "Service",
      value: [
        booking.service_name,
        formatDur(booking.service_duration_min),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    ...(booking.service_price_cents > 0
      ? [{ label: "Total", value: formatPrice(booking.service_price_cents) }]
      : []),
    { label: "Client", value: booking.customer_name },
    {
      label: "Phone",
      value: booking.customer_phone
        ? displayPhone(booking.customer_phone)
        : "—",
    },
    ...(booking.customer_email
      ? [{ label: "Email", value: booking.customer_email }]
      : []),
  ];

  return (
    <>
      {showCancel && (
        <CancelDialog
          bookingRef={refCode}
          onCancelled={() => {
            setCancelled(true);
            setShowCancel(false);
          }}
          onClose={() => setShowCancel(false)}
        />
      )}

      <main className="min-h-screen bg-bg text-body">
        {/* Nav */}
        <nav
          className="sticky top-0 z-40 border-b border-border bg-bg/95"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-md sm:px-xl">
            <Link
              href="/"
              className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg hover:opacity-70"
            >
              {clientConfig.brand.shortName}
            </Link>
            <p className="font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
              {clientConfig.brand.name}
            </p>
            <Link
              href="/"
              className="font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] text-fg hover:opacity-70"
            >
              Home
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-5xl px-md py-xl sm:px-xl sm:py-xxl">
          {/* Cancelled banner */}
          {cancelled && (
            <div className="mb-lg border border-warning bg-card px-md py-sm">
              <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-warning">
                This reservation has been cancelled.
              </p>
            </div>
          )}

          {/* Reference hero */}
          <div className="mb-xl border-b border-border pb-xl">
            <p className={`${labelBase} mb-sm`}>
              {cancelled ? "Cancelled reservation" : "Reservation confirmed"}
            </p>
            <p
              className="font-mono text-fg"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 5.5rem)",
                letterSpacing: "0.18em",
                lineHeight: 1,
              }}
            >
              {booking.reference_code}
            </p>
            <p className={`${labelBase} mt-sm`}>
              Keep this reference for lookup or changes
            </p>
          </div>

          {/* Content */}
          <div className="grid gap-xl lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-xxl">
            {/* Left: details */}
            <div className="grid gap-lg">
              {/* Date/time prominent */}
              <div>
                <p className={`${labelBase} mb-xs`}>Date & time</p>
                <p
                  className="font-display uppercase text-fg"
                  style={{
                    fontSize: "var(--display-sm-size)",
                    letterSpacing: "var(--display-sm-tracking)",
                  }}
                >
                  {booking.starts_at
                    ? formatDisplayDatetime(booking.starts_at, tz)
                    : "—"}
                </p>
              </div>

              {/* Detail rows */}
              <div className="grid gap-0">
                {detailRows.map((item, i) => (
                  <div
                    key={item.label}
                    className={`grid gap-md py-sm ${
                      i < detailRows.length - 1 ? "border-b border-border" : ""
                    }`}
                    style={{ gridTemplateColumns: "5rem 1fr" }}
                  >
                    <p className={labelBase}>{item.label}</p>
                    <p
                      className="text-fg"
                      style={{
                        fontSize: "var(--body-sm-size)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="border-t border-border pt-sm">
                <p className={`${labelBase} mb-xs`}>Salon address</p>
                <p
                  className="text-fg"
                  style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.5 }}
                >
                  {booking.location_address}
                </p>
                <a
                  href={mapsLink(booking.location_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-xs inline-block font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-accent hover:opacity-70"
                >
                  Open in Google Maps →
                </a>
              </div>

              {booking.notes && (
                <div className="border-t border-border pt-sm">
                  <p className={`${labelBase} mb-xs`}>Notes</p>
                  <p
                    className="text-body"
                    style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}
                  >
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="grid gap-sm content-start">
              <p className={`${labelBase} mb-xs`}>Actions</p>

              {/* Primary actions — filled dark */}
              <a
                href={googleCalLink(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity hover:opacity-80"
                style={{ background: "var(--ink)", color: "var(--canvas)" }}
              >
                Add to Google Calendar
              </a>

              <a
                href={whatsappLink(whatsappMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity hover:opacity-80"
                style={{ background: "var(--ink)", color: "var(--canvas)" }}
              >
                Send details to WhatsApp
              </a>

              {/* Secondary actions — outlined */}
              <Link
                href="/my-bookings"
                className="flex h-11 items-center justify-center border border-fg px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-colors hover:bg-fg hover:text-canvas"
              >
                View booking history
              </Link>
              <Link
                href="/book"
                className="flex h-11 items-center justify-center border border-fg px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-fg transition-colors hover:bg-fg hover:text-canvas"
              >
                Make another reservation
              </Link>

              {!cancelled && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="mt-sm flex h-11 items-center justify-center border border-border px-md font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-muted-fg transition-colors hover:border-warning hover:text-warning"
                >
                  Cancel this reservation
                </button>
              )}

              <p
                className="mt-xs text-muted-fg"
                style={{ fontSize: "var(--body-sm-size)", lineHeight: 1.6 }}
              >
                Cancellations are accepted up to 4 hours before the appointment
                time.
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-xl border-t border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-md py-md sm:px-xl">
            <p className={labelBase}>
              {clientConfig.brand.name} · Est. 1998 · <a href="tel:011780710" className="hover:opacity-70">01 780 710</a>
            </p>
            <Link
              href="/"
              className={`${labelBase} transition-opacity hover:opacity-70`}
            >
              Home →
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
