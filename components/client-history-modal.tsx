"use client";

import { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Beirut";

type Booking = {
  id: string;
  reference_code: string;
  starts_at: string;
  status: string;
  services: { name: string; price_cents: number } | null;
  staff: { name: string } | null;
};

type Penalty = {
  id: string;
  type: "late_arrival" | "same_day_cancel";
  amount_cents: number;
  note: string | null;
  created_at: string;
  staff: { name: string } | null;
};

type Props = {
  customerName: string;
  customerPhone: string;
  onClose: () => void;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }
function fmtDate(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T")), TZ, "EEE d MMM yyyy · HH:mm"); } catch { return ts; }
}

const label = "font-mono text-[10px] uppercase tracking-widest text-muted-fg";

export function ClientHistoryModal({ customerName, customerPhone, onClose }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/client/${encodeURIComponent(customerPhone)}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setPenalties(d.penalties ?? []); })
      .finally(() => setLoading(false));
  }, [customerPhone]);

  const visits = bookings.filter(b => b.status !== "cancelled").length;
  const totalPenalties = penalties.reduce((s, p) => s + p.amount_cents, 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "2rem 1rem" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 560, background: "#F9F6F1", border: "1px solid var(--hairline)", padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.08em", textTransform: "uppercase", color: "#1C1714" }}>
              {customerName}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginTop: 2 }}>
              {customerPhone}
            </p>
          </div>
          <button onClick={onClose} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.4)", background: "none", border: "none", cursor: "pointer" }}>
            ✕ Close
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Total visits", value: String(visits) },
            { label: "Bookings", value: String(bookings.length) },
            { label: "Penalties", value: penalties.length > 0 ? fmt(totalPenalties) : "None" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "10px 12px" }}>
              <p className={label} style={{ marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "0.05em", color: "#1C1714" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className={label}>Loading…</p>
        ) : (
          <>
            {/* Penalties */}
            {penalties.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className={label} style={{ marginBottom: 8 }}>Penalties</p>
                <div style={{ display: "grid", gap: 6 }}>
                  {penalties.map(p => (
                    <div key={p.id} style={{ background: "#fff", border: "1px solid #C4871F", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C4871F" }}>
                          {p.type === "late_arrival" ? "Late arrival" : "Same-day cancel"}
                        </p>
                        {p.note && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(28,23,20,0.6)", marginTop: 2 }}>{p.note}</p>}
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.4)", marginTop: 2 }}>
                          {fmtDate(p.created_at)}{p.staff ? ` · ${p.staff.name}` : ""}
                        </p>
                      </div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#C4871F", fontWeight: 600 }}>{fmt(p.amount_cents)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking history */}
            <div>
              <p className={label} style={{ marginBottom: 8 }}>Booking history</p>
              {bookings.length === 0 ? (
                <p className={label}>No bookings found.</p>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {bookings.map(b => (
                    <div key={b.id} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "10px 12px", opacity: b.status === "cancelled" ? 0.5 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#1C1714" }}>{fmtDate(b.starts_at)}</p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginTop: 2 }}>
                            {b.services?.name ?? "—"} · {b.staff?.name ?? "—"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: b.status === "confirmed" ? "#1C1714" : "rgba(28,23,20,0.45)" }}>
                            {b.status}
                          </p>
                          {b.services?.price_cents ? (
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(28,23,20,0.55)", marginTop: 2 }}>
                              {fmt(b.services.price_cents)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
