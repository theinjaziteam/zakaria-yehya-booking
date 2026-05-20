"use client";

import { useState } from "react";

type Staff = { id: string; name: string };
type Service = { id: string; name: string; duration_min: number; price_cents: number };
type Location = { id: string; name: string };

type Props = { locations: Location[]; onCreated: () => void };

const COUNTRY_CODES = [
  { code: "+961", label: "LB" },
  { code: "+966", label: "SA" },
  { code: "+971", label: "AE" },
  { code: "+1",   label: "US" },
  { code: "+44",  label: "GB" },
];

export function NewBookingForm({ locations, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+961");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function loadOptions(locId: string) {
    setLocationId(locId);
    setServiceId("");
    setStaffId("");
    const [svcRes, staffRes] = await Promise.all([
      fetch(`/api/admin/options?type=services`).then(r => r.json()),
      fetch(`/api/admin/options?type=staff&loc=${locId}`).then(r => r.json()),
    ]);
    setServices(svcRes ?? []);
    setStaff(staffRes ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId || !serviceId || !staffId || !date || !time || !name || !phone) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: locationId,
          service_id: serviceId,
          staff_id: staffId,
          date,
          time,
          customer_name: name,
          customer_phone: `${countryCode}${phone.replace(/^0+/, "")}`,
          customer_email: email || null,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "slot_taken"
          ? "That slot is already taken — choose another time."
          : (json.error ?? "Booking failed."));
      } else {
        setSuccess(`Booking created — ref ${json.reference_code}`);
        setName(""); setPhone(""); setEmail(""); setNotes("");
        setDate(""); setTime(""); setServiceId(""); setStaffId("");
        onCreated();
        setTimeout(() => { setSuccess(null); setOpen(false); }, 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg mb-1 block";
  const input = "w-full border border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-fg focus:outline-none";

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (!services.length) loadOptions(locationId); }}
        className="shrink-0 border border-fg px-4 py-2 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
      >
        + New booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16">
          <div className="w-full max-w-lg border border-border bg-bg p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-lg uppercase tracking-wide text-fg">New booking</p>
              <button onClick={() => setOpen(false)} className="font-mono text-xs uppercase tracking-widest text-muted-fg hover:opacity-70">✕ Close</button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Location */}
              <div>
                <label className={label}>Salon *</label>
                <select value={locationId} onChange={e => loadOptions(e.target.value)} className={input}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              {/* Service + Staff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Service *</label>
                  <select value={serviceId} onChange={e => setServiceId(e.target.value)} className={input}>
                    <option value="">Select…</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Stylist *</label>
                  <select value={staffId} onChange={e => setStaffId(e.target.value)} className={input}>
                    <option value="">Select…</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={input} />
                </div>
                <div>
                  <label className={label}>Time *</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className={input} />
                </div>
              </div>

              {/* Customer */}
              <div>
                <label className={label}>Client name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className={input} />
              </div>
              <div>
                <label className={label}>Phone *</label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="border border-border bg-bg px-2 py-2 font-mono text-sm text-fg focus:outline-none">
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label} {c.code}</option>)}
                  </select>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="76 123 456" className={`${input} flex-1`} />
                </div>
              </div>
              <div>
                <label className={label}>Email <span className="normal-case text-muted-fg">(optional)</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" className={input} />
              </div>
              <div>
                <label className={label}>Notes <span className="normal-case text-muted-fg">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={200} placeholder="Any details…" className={`${input} resize-none`} />
              </div>

              {error && <p className="font-mono text-xs uppercase tracking-widest text-warning">{error}</p>}
              {success && <p className="font-mono text-xs uppercase tracking-widest text-success">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 border border-fg px-6 py-2 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas disabled:opacity-50"
              >
                {loading ? "Creating…" : "Confirm booking"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
