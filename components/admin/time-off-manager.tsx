"use client";

import { useState } from "react";

type StaffRow = { id: string; name: string };
type Row = { id: string; staff_id: string; staff_name: string; starts_at: string; ends_at: string; starts_fmt: string; ends_fmt: string; reason: string | null };

export function TimeOffManager({ staff, initialRows }: { staff: StaffRow[]; initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !startsAt || !endsAt) { setErr("All fields required"); return; }
    if (endsAt <= startsAt) { setErr("End must be after start"); return; }
    setAdding(true); setErr(null);

    const res = await fetch("/api/admin/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId, starts_at: startsAt, ends_at: endsAt, reason }),
    });
    const json = await res.json();
    if (!res.ok) { setErr(json.error ?? "Failed"); setAdding(false); return; }

    const staffName = staff.find(s => s.id === staffId)?.name ?? "—";
    const newRow: Row = {
      id: json.id,
      staff_id: staffId,
      staff_name: staffName,
      starts_at: startsAt,
      ends_at: endsAt,
      starts_fmt: startsAt.replace("T", " ").slice(0, 16),
      ends_fmt: endsAt.replace("T", " ").slice(0, 16),
      reason: reason || null,
    };
    setRows(prev => [newRow, ...prev]);
    setStartsAt(""); setEndsAt(""); setReason("");
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/admin/time-off", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setRows(prev => prev.filter(r => r.id !== id));
  }

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg";
  const inp = "border border-border bg-card px-3 py-2 font-mono text-sm text-fg focus:outline-none focus:border-fg w-full";

  return (
    <div className="grid gap-6">
      {/* Add form */}
      <div className="border border-border bg-card p-5">
        <p className={`${label} mb-4`}>Add time off</p>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={`${label} mb-1`}>Stylist</p>
            <select value={staffId} onChange={e => setStaffId(e.target.value)} className={inp}>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <p className={`${label} mb-1`}>From</p>
            <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inp} />
          </div>
          <div>
            <p className={`${label} mb-1`}>To</p>
            <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inp} />
          </div>
          <div>
            <p className={`${label} mb-1`}>Reason (optional)</p>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Vacation, sick leave…" className={inp} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={adding}
              className="h-9 px-5 font-mono text-xs uppercase tracking-widest transition-opacity disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--canvas)", borderRadius: "var(--radius-pill)" }}
            >
              {adding ? "Adding…" : "Add time off"}
            </button>
            {err && <p className={`${label} text-warning`}>{err}</p>}
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <p className={`${label} mb-3`}>{rows.length} entries</p>
        {rows.length === 0 ? (
          <p className={`${label} opacity-50`}>No time off scheduled.</p>
        ) : (
          <div className="grid gap-2">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-4 border border-border bg-card px-5 py-3">
                <div className="min-w-0">
                  <p className="font-display text-base uppercase tracking-wide text-fg truncate">{r.staff_name}</p>
                  <p className={`${label} mt-0.5`}>{r.starts_fmt} → {r.ends_fmt}</p>
                  {r.reason && <p className="font-mono text-xs text-muted-fg mt-0.5 opacity-70">{r.reason}</p>}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className={`${label} shrink-0 transition-opacity hover:opacity-70 text-warning`}
                  title="Delete"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
