"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientConfig } from "@/config/client";
import { formatInTimeZone } from "date-fns-tz";

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
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }
function fmtTime(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T")), TZ, "HH:mm"); } catch { return "—"; }
}
function fmtDate(ts: string) {
  try { return formatInTimeZone(new Date(ts.replace(" ", "T")), TZ, "EEE d MMM"); } catch { return ts; }
}

const label = "font-mono text-[10px] uppercase tracking-widest text-muted-fg";

export default function StaffDashboard() {
  const router = useRouter();
  const [staffName, setStaffName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [filter, setFilter] = useState<"today" | "upcoming" | "all">("today");
  const [tab, setTab] = useState<"bookings" | "tips">("bookings");
  const [loading, setLoading] = useState(true);

  // Tip form
  const [tipAmount, setTipAmount] = useState("");
  const [tipCustomer, setTipCustomer] = useState("");
  const [tipNote, setTipNote] = useState("");
  const [tipDate, setTipDate] = useState(new Date().toISOString().slice(0, 10));
  const [tipSaving, setTipSaving] = useState(false);
  const [tipMsg, setTipMsg] = useState<string | null>(null);

  useEffect(() => {
    const cookie = document.cookie.split(";").find(c => c.trim().startsWith("yz_staff_session="));
    if (!cookie) { router.replace("/staff/login"); return; }
    try {
      const value = cookie.trim().substring(cookie.indexOf("=") + 1);
      const data = JSON.parse(atob(value));
      setStaffName(data.name ?? "");
      setIsOwner(data.is_owner === true);
    } catch { router.replace("/staff/login"); }
  }, [router]);

  useEffect(() => {
    if (!staffName) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/staff/bookings?filter=${filter}`).then(r => r.json()),
      fetch("/api/staff/tips").then(r => r.json()),
    ]).then(([b, t]) => {
      setBookings(Array.isArray(b) ? b : []);
      setTips(Array.isArray(t) ? t : []);
    }).finally(() => setLoading(false));
  }, [staffName, filter]);

  async function addTip() {
    const cents = Math.round(parseFloat(tipAmount) * 100);
    if (!cents || cents <= 0) return;
    setTipSaving(true);
    await fetch("/api/staff/tips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_cents: cents, customer_name: tipCustomer || null, note: tipNote || null, tip_date: tipDate }),
    });
    setTipMsg("Tip saved ✓");
    setTipAmount(""); setTipCustomer(""); setTipNote("");
    const t = await fetch("/api/staff/tips").then(r => r.json());
    setTips(Array.isArray(t) ? t : []);
    setTipSaving(false);
    setTimeout(() => setTipMsg(null), 2500);
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
  const todayTips = tips.filter(t => t.tip_date === new Date().toISOString().slice(0, 10)).reduce((s, t) => s + t.amount_cents, 0);

  // Customer frequency from bookings
  const freq: Record<string, number> = {};
  bookings.forEach(b => { freq[b.customer_name] = (freq[b.customer_name] ?? 0) + 1; });

  return (
    <div style={{ minHeight: "100vh", background: "#F9F6F1" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--hairline)", background: "#F9F6F1", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 1rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase", color: "#1C1714" }}>
              {clientConfig.brand.shortName}
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(28,23,20,0.4)" }}>
              {staffName}
            </p>
          </div>
          <button onClick={signOut} style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", background: "none", border: "none", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 768, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hairline)", marginBottom: 24 }}>
          {(["bookings", ...(!isOwner ? ["tips"] : [])] as ("bookings" | "tips")[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", border: "none", borderBottom: tab === t ? "2px solid #1C1714" : "2px solid transparent", background: "transparent", color: tab === t ? "#1C1714" : "rgba(28,23,20,0.45)", cursor: "pointer" }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(["today", "upcoming", "all"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 16px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", border: "1px solid", borderColor: filter === f ? "#1C1714" : "var(--hairline)", background: filter === f ? "#1C1714" : "transparent", color: filter === f ? "#F9F6F1" : "rgba(28,23,20,0.55)", cursor: "pointer" }}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? <p className={label}>Loading…</p> : bookings.length === 0 ? (
              <p className={label}>No bookings for this period.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "16px", opacity: b.status === "cancelled" ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: "0.05em", textTransform: "uppercase", color: "#1C1714" }}>
                          {fmtTime(b.starts_at)} — {fmtDate(b.starts_at)}
                        </p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginTop: 2 }}>
                          {b.services?.name ?? "—"} · {b.locations?.name ?? "—"}
                        </p>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: b.status === "confirmed" ? "#1C1714" : "#C4871F" }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)", display: "flex", gap: 24 }}>
                      <div>
                        <p className={label}>Client</p>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#1C1714" }}>{b.customer_name}</p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(28,23,20,0.45)", letterSpacing: "0.06em" }}>{b.customer_phone}</p>
                        {freq[b.customer_name] && freq[b.customer_name]! > 1 && (
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#865F10", marginTop: 2 }}>
                            {freq[b.customer_name]}× visits
                          </p>
                        )}
                      </div>
                      {b.services?.price_cents ? (
                        <div>
                          <p className={label}>Value</p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#1C1714" }}>{fmt(b.services.price_cents)}</p>
                        </div>
                      ) : null}
                    </div>
                    {b.notes && (
                      <p style={{ marginTop: 8, fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(28,23,20,0.6)", borderLeft: "2px solid #C4871F", paddingLeft: 8 }}>{b.notes}</p>
                    )}
                  </div>
                ))}
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
              <p className={label} style={{ marginBottom: 12 }}>Add tip</p>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <p className={label} style={{ marginBottom: 4 }}>Amount ($) *</p>
                    <input type="number" step="0.5" min="0" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "6px 0", fontFamily: "var(--font-mono)", fontSize: 15, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <p className={label} style={{ marginBottom: 4 }}>Date</p>
                    <input type="date" value={tipDate} onChange={e => setTipDate(e.target.value)} style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "6px 0", fontFamily: "var(--font-mono)", fontSize: 12, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <p className={label} style={{ marginBottom: 4 }}>Client name (optional)</p>
                  <input type="text" value={tipCustomer} onChange={e => setTipCustomer(e.target.value)} placeholder="Who tipped you?" style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "6px 0", fontFamily: "var(--font-body)", fontSize: 14, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <p className={label} style={{ marginBottom: 4 }}>Note (optional)</p>
                  <input type="text" value={tipNote} onChange={e => setTipNote(e.target.value)} placeholder="Any note…" style={{ width: "100%", borderBottom: "1px solid rgba(28,23,20,0.25)", background: "transparent", padding: "6px 0", fontFamily: "var(--font-body)", fontSize: 14, color: "#1C1714", outline: "none", boxSizing: "border-box" }} />
                </div>
                {tipMsg && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3E6E34" }}>{tipMsg}</p>}
                <button onClick={addTip} disabled={tipSaving || !tipAmount} style={{ padding: "10px", background: "#1C1714", color: "#F9F6F1", border: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", opacity: tipSaving || !tipAmount ? 0.5 : 1 }}>
                  {tipSaving ? "Saving…" : "Save tip"}
                </button>
              </div>
            </div>

            {/* Tips list */}
            {tips.length === 0 ? <p className={label}>No tips recorded yet.</p> : (
              <div style={{ display: "grid", gap: 8 }}>
                {tips.map(t => (
                  <div key={t.id} style={{ background: "#fff", border: "1px solid var(--hairline)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "#1C1714" }}>{fmt(t.amount_cents)}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.45)", marginTop: 2 }}>
                        {t.tip_date} {t.customer_name ? `· ${t.customer_name}` : ""} {t.note ? `· ${t.note}` : ""}
                      </p>
                    </div>
                    <button onClick={() => deleteTip(t.id)} style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(28,23,20,0.35)", background: "none", border: "none", cursor: "pointer" }}>
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
