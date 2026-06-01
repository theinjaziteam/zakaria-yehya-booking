"use client";

import { useState } from "react";

type StaffRow = { id: string; name: string; title: string | null };
type WorkingHour = { staff_id: string; location_id: string; day_of_week: number; start_time: string; end_time: string };
type Location = { id: string; name: string };

type DayHour = { day_of_week: number; start_time: string; end_time: string; closed: boolean };

const TIME_OPTS: string[] = [];
for (let h = 7; h <= 23; h++) {
  TIME_OPTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_OPTS.push(`${String(h).padStart(2, "0")}:30`);
}

function buildStaffHours(staffId: string, locationId: string, hours: WorkingHour[], days: string[]): DayHour[] {
  return days.map((_, dow) => {
    const found = hours.find(h => h.staff_id === staffId && h.location_id === locationId && h.day_of_week === dow);
    return found
      ? { day_of_week: dow, start_time: found.start_time.slice(0, 5), end_time: found.end_time.slice(0, 5), closed: false }
      : { day_of_week: dow, start_time: "09:00", end_time: "20:00", closed: true };
  });
}

function StaffHoursRow({
  member, locationId, initialHours, days,
}: { member: StaffRow; locationId: string; initialHours: DayHour[]; days: string[] }) {
  const [dayHours, setDayHours] = useState<DayHour[]>(initialHours);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(dow: number) {
    setDayHours(prev => prev.map(d => d.day_of_week === dow ? { ...d, closed: !d.closed } : d));
    setSaved(false);
  }
  function setTime(dow: number, field: "start_time" | "end_time", val: string) {
    setDayHours(prev => prev.map(d => d.day_of_week === dow ? { ...d, [field]: val } : d));
    setSaved(false);
  }

  async function save() {
    setSaving(true); setErr(null);
    const res = await fetch("/api/admin/hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: member.id, location_id: locationId, hours: dayHours }),
    });
    setSaving(false);
    if (res.ok) setSaved(true);
    else setErr("Save failed");
  }

  return (
    <div className="border border-border bg-card p-5 grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg uppercase tracking-wide text-fg">{member.name}</p>
          {member.title && <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">{member.title}</p>}
        </div>
        <div className="flex items-center gap-3">
          {err && <p className="font-mono text-xs uppercase tracking-widest text-warning">{err}</p>}
          {saved && <p className="font-mono text-xs uppercase tracking-widest text-success">Saved</p>}
          <button
            onClick={save}
            disabled={saving}
            className="h-9 px-4 font-mono text-xs uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--canvas)", borderRadius: "var(--radius-pill)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {dayHours.map((d) => (
          <div key={d.day_of_week} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-10">
              <button
                type="button"
                onClick={() => toggle(d.day_of_week)}
                className="w-8 h-4 rounded-full flex items-center transition-colors shrink-0"
                style={{ background: d.closed ? "var(--hairline)" : "var(--accent)", padding: "2px" }}
                title={d.closed ? "Closed — click to open" : "Open — click to close"}
              >
                <span
                  className="block w-3 h-3 rounded-full bg-white transition-transform"
                  style={{ transform: d.closed ? "translateX(0)" : "translateX(16px)" }}
                />
              </button>
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-fg w-8 shrink-0">{days[d.day_of_week]}</span>
            {d.closed ? (
              <span className="font-mono text-xs uppercase tracking-widest text-muted-fg opacity-40">Closed</span>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={d.start_time}
                  onChange={e => setTime(d.day_of_week, "start_time", e.target.value)}
                  className="border border-border bg-card px-2 py-1 font-mono text-xs text-fg focus:outline-none focus:border-fg"
                >
                  {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="font-mono text-xs text-muted-fg">—</span>
                <select
                  value={d.end_time}
                  onChange={e => setTime(d.day_of_week, "end_time", e.target.value)}
                  className="border border-border bg-card px-2 py-1 font-mono text-xs text-fg focus:outline-none focus:border-fg"
                >
                  {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HoursEditor({ staff, locations, hours, days }: {
  staff: StaffRow[];
  locations: Location[];
  hours: WorkingHour[];
  days: string[];
}) {
  const loc = locations[0];
  if (!loc) return <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">No active locations found.</p>;

  return (
    <div className="grid gap-4">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">Location: {loc.name}</p>
      {staff.map(member => (
        <StaffHoursRow
          key={member.id}
          member={member}
          locationId={loc.id}
          initialHours={buildStaffHours(member.id, loc.id, hours, days)}
          days={days}
        />
      ))}
    </div>
  );
}
