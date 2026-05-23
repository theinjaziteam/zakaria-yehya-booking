"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientConfig } from "@/config/client";
import { formatInTimeZone } from "date-fns-tz";
import { ClientHistoryModal } from "@/components/client-history-modal";

const TZ = clientConfig.business.defaultTimezone;

type Booking = {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  services: { name: string; price_cents: number } | null;
  locations: { name: string } | null;
};

type Tip = {
  id: string;
  customer_name: string | null;
  amount_cents: number;
  note: string | null;
  tip_date: string;
  booking_id: string | null;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }
function fmtTime(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T")), TZ, "HH:mm"); } catch { return "—"; }
}
function fmtDate(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T")), TZ, "EEE d MMM"); } catch { return ts; }
}

const label = "font-mono text-[12px] uppercase tracking-widest text-muted-fg";

function today() { return new Date().toISOString().slice(0, 10); }

const NO_TIPS_STAFF = new Set([
  "e21354fe-3181-4a7d-9ba1-6c48b53a1835", // Zakaria Haddad
  "16e1eef0-aa64-4bb6-8f22-baae23efbbb9", // Yehya Khoury
]);

export default function StaffDashboard() {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState<"today" | "upcoming" | "all">("upcoming");
  const [tab, setTab] = useState<"bookings" | "tips">("bookings");
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<{ name: string; phone: string } | null>(null);
  const [lateMarking, setLateMarking] = useState<Record<string, "idle" | "saving" | "done">>({});

  // Tip form
  const [tipAmount, setTipAmount] = useState("");
  const [tipCustomer, setTipCustomer] = useState("");
  const [tipNote, setTipNote] = useState("");
  const [tipDate, setTipDate] = useState(today);
  const [tipBookingId, setTipBookingId] = useState<string | null>(null);
  const [tipSaving, setTipSaving] = useState(false);
  const [tipMsg, setTipMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff/me")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setStaffId(data.id ?? ""); setStaffName(data.name ?? ""); setIsOwner(data.is_owner === true); setAuthLoaded(true); })
      .catch(() => { window.location.href = "/staff/login"; });
  }, []);

  useEffect(() => {
    if (!staffName) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/staff/bookings?filter=${filter}`).then(r => r.json()),
      fetch("/api/staff/tips").then(r => r.json()),
      fetch("/api/staff/penalties").then(r => r.json()),
    ]).then(([b, t, lateIds]) => {
      setBookings(Array.isArray(b) ? b : []);
      setTips(Array.isArray(t) ? t : []);
      if (Array.isArray(lateIds)) {
        const already: Record<string, "done"> = {};
        lateIds.forEach((id: string) => { already[id] = "done"; });
        setLateMarking(already);
      }
    }).finally(() => setLoading(false));
  }, [staffName, filter]);

  // Customers who have previously tipped (for the "tipped before" indicator)
  const tippedPhones = new Set(
    tips.filter(t => t.customer_name).map(t => t.customer_name!)
  );

  // Today's bookings for tip autocomplete
  const todayStr = today();
  const todayBookings = bookings.filter(b => b.starts_at.startsWith(todayStr) && b.status !== "cancelled");

  async function addTip() {
    const cents = Math.round(parseFloat(tipAmount) * 100);
    if (!cents || cents <= 0) return;
    setTipSaving(true);
    const res = await fetch("/api/staff/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount_cents: cents,
        customer_name: tipCustomer || null,
        note: tipNote || null,
        tip_date: tipDate,
        booking_id: tipBookingId || null,
      }),
    });
    if (res.ok) {
      setTipMsg("Tip saved ✓");
      setTipAmount(""); setTipCustomer(""); setTipNote(""); setTipBookingId(null);
      const t = await fetch("/api/staff/tips").then(r => r.json());
      setTips(Array.isArray(t) ? t : []);
    } else {
      const err = await res.json().catch(() => ({}));
      setTipMsg(`Error: ${err.error ?? "failed"}`);
    }
    setTipSaving(false);
    setTimeout(() => setTipMsg(null), 3000);
  }

  function selectTipBooking(bookingId: string) {
    const b = bookings.find(b => b.id === bookingId);
    if (b) { setTipCustomer(b.customer_name); setTipBookingId(b.id); }
    else { setTipBookingId(null); }
  }

  async function markLate(booking: Booking) {
    if (lateMarking[booking.id] === "saving" || lateMarking[booking.id] === "done") return;
    setLateMarking(prev => ({ ...prev, [booking.id]: "saving" }));
    await fetch("/api/staff/penalties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: booking.id,
        customer_phone: booking.customer_phone,
        customer_name: booking.customer_name,
        type: "late_arrival",
        amount_cents: 500,
        note: `Late arrival — ref ${booking.reference_code}`,
      }),
    });
    setLateMarking(prev => ({ ...prev, [booking.id]: "done" }));
  }

  async function deleteTip(id: string) {
    await fetch("/api/staff/tips", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setTips(tips.filter(t => t.id !== id));
  }

  async function signOut() {
    await fetch("/api/staff/auth", { method: "DELETE" });
    router.replace("/staff/login");
  }

  const totalTips = tips.reduce((s, t) => s + t.amount_cents, 0);
  const todayTips = tips.filter(t => t.tip_date === todayStr).reduce((s, t) => s + t.amount_cents, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F1" }}>
      {selectedClient && (
        <ClientHistoryModal
          customerName={selectedClient.name}
          customerPhone={selectedClient.phone}
          onClose={() => setSelectedClient(null)}
        />
      )}
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--hairline)", background: "#F9F6F1", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 1rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 15, letterSpacing: "0.3em", textTransform: "uppercase", color: "#1C1714" }}>
              {clientConfig.brand.shortName}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)" }}>
              {staffName}
            </p>
          </div>
          <button onClick={signOut} style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.5)", background: "none", border: "none", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 768, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Tabs — only render once we know isOwner, prevents tips flashing for owners */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hairline)", marginBottom: 24 }}>
          {authLoaded && (["bookings", ...(!isOwner && !NO_TIPS_STAFF.has(staffId) ? ["tips"] : [])] as ("bookings" | "tips")[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 24px", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", border: "none", borderBottom: tab === t ? "2px solid #1C1714" : "2px solid transparent", background: "transparent", color: tab === t ? "#1C1714" : "rgba(28,23,20,0.45)", cursor: "pointer" }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(["today", "upcoming", "all"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 18px", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid", borderColor: filter === f ? "#1C1714" : "var(--hairline)", background: filter === f ? "#1C1714" : "transparent", color: filter === f ? "#F9F6F1" : "rgba(28,23,20,0.55)", cursor: "pointer" }}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? <p className={label}>Loading…</p> : bookings.length === 0 ? (
              <p className={label}>No bookings for this period.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {bookings.map(b => {
                  const hasTippedBefore = tippedPhones.has(b.customer_name);
                  return (
                    <div key={b.id} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "18px", opacity: b.status === "cancelled" ? 0.5 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1C1714" }}>
                            {fmtTime(b.starts_at)} — {fmtDate(b.starts_at)}
                          </p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.5)", marginTop: 3 }}>
                            {b.services?.name ?? "—"} · {b.locations?.name ?? "—"}
                          </p>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: b.status === "confirmed" ? "#1C1714" : "#C4871F" }}>
                          {b.status}
                        </span>
                      </div>
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                        <div style={{ display: "flex", gap: 28 }}>
                          <div>
                            <p className={label}>Client</p>
                            <button
                              onClick={() => setSelectedClient({ name: b.customer_name, phone: b.customer_phone })}
                              style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "#1C1714", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: "rgba(28,23,20,0.25)" }}
                            >
                              {b.customer_name}
                            </button>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(28,23,20,0.45)", letterSpacing: "0.06em", marginTop: 2 }}>{b.customer_phone}</p>
                            {hasTippedBefore && (
                              <p style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#865F10", marginTop: 3 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9 12h6"/></svg>
                                Tipped before
                              </p>
                            )}
                          </div>
                          {b.services?.price_cents ? (
                            <div>
                              <p className={label}>Value</p>
                              <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#1C1714" }}>{fmt(b.services.price_cents)}</p>
                            </div>
                          ) : null}
                        </div>
                        {b.status === "confirmed" && (
                          <button
                            onClick={() => markLate(b)}
                            disabled={lateMarking[b.id] === "saving" || lateMarking[b.id] === "done"}
                            style={{
                              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                              padding: "6px 12px", border: "1px solid",
                              borderColor: lateMarking[b.id] === "done" ? "rgba(28,23,20,0.2)" : "#C4871F",
                              color: lateMarking[b.id] === "done" ? "rgba(28,23,20,0.35)" : "#C4871F",
                              background: "none", cursor: lateMarking[b.id] === "done" ? "default" : "pointer",
                              opacity: lateMarking[b.id] === "saving" ? 0.5 : 1,
                            }}
                          >
                            {lateMarking[b.id] === "done" ? "Late recorded" : lateMarking[b.id] === "saving" ? "…" : "Mark late +$5"}
                          </button>
                        )}
                      </div>
                      {b.notes && (
                        <p style={{ marginTop: 10, fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(28,23,20,0.6)", borderLeft: "2px solid #C4871F", paddingLeft: 10 }}>{b.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── TIPS TAB ── */}
        {tab === "tips" && (
          <>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[{ label: "Today's tips", value: fmt(todayTips) }, { label: "All-time tips", value: fmt(totalTips) }].map(s => (
                <div key={s.label} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: 16 }}>
                  <p className={label} style={{ marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: "0.05em", color: "#1C1714" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Add tip */}
            <div style={{ background: "#fff", border: "1px solid var(--hairline)", padding: 20, marginBottom: 24 }}>
              <p className={label} style={{ marginBottom: 14 }}>Add tip</p>
              <div style={{ display: "grid", gap: 14 }}>

                {/* Client name — datalist gives typeahead from today's bookings, free typing allowed */}
                <div>
                  <p className={label} style={{ marginBottom: 4 }}>Client name</p>
                  <input
                    list="tip-clients-list"
                    type="text"
                    value={tipCustomer}
                    onChange={e => {
                      setTipCustomer(e.target.value);
                      // Auto-link booking_id if name matches a today booking exactly
                      const match = todayBookings.find(b => b.customer_name.toLowerCase() === e.target.value.toLowerCase());
                      setTipBookingId(match?.id ?? null);
                    }}
                    placeholder="Type or pick from today's appointments…"
                    style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "8px 0", fontFamily: "var(--font-body)", fontSize: 15, color: "#1C1714", outline: "none", boxSizing: "border-box" }}
                  />
                  <datalist id="tip-clients-list">
                    {todayBookings.map(b => (
                      <option key={b.id} value={b.customer_name}>
                        {fmtTime(b.starts_at)}{b.services?.name ? ` · ${b.services.name}` : ""}
                      </option>
                    ))}
                  </datalist>
                  {tipBookingId && (
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#865F10", marginTop: 4 }}>
                      Linked to today's appointment
                    </p>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p className={label} style={{ marginBottom: 4 }}>Amount ($) *</p>
                    <input type="number" step="0.5" min="0" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "8px 0", fontFamily: "var(--font-mono)", fontSize: 16, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <p className={label} style={{ marginBottom: 4 }}>Date</p>
                    <input type="date" value={tipDate} onChange={e => setTipDate(e.target.value)} style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "8px 0", fontFamily: "var(--font-mono)", fontSize: 13, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <p className={label} style={{ marginBottom: 4 }}>Note (optional)</p>
                  <input type="text" value={tipNote} onChange={e => setTipNote(e.target.value)} placeholder="Any note…" style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "8px 0", fontFamily: "var(--font-body)", fontSize: 15, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                </div>
                {tipMsg && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: tipMsg.startsWith("Error") ? "#C4871F" : "#3E6E34" }}>
                    {tipMsg}
                  </p>
                )}
                <button onClick={addTip} disabled={tipSaving || !tipAmount} style={{ padding: "12px", background: "#1C1714", color: "#F9F6F1", border: "none", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", opacity: tipSaving || !tipAmount ? 0.5 : 1 }}>
                  {tipSaving ? "Saving…" : "Save tip"}
                </button>
              </div>
            </div>

            {/* Tips list */}
            {tips.length === 0 ? <p className={label}>No tips recorded yet.</p> : (
              <div style={{ display: "grid", gap: 8 }}>
                {tips.map(t => (
                  <div key={t.id} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 17, color: "#1C1714" }}>{fmt(t.amount_cents)}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.5)", marginTop: 2 }}>
                        {t.tip_date}{t.customer_name ? ` · ${t.customer_name}` : ""}{t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteTip(t.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.35)", background: "none", border: "none", cursor: "pointer" }}>
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
