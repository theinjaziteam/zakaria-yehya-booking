"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Staff = { id: string; name: string };
type Service = { id: string; name: string; duration_min: number; price_cents: number };
type Location = { id: string; name: string };

type Props = { locations: Location[] };

export function NewBookingForm({ locations }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [locationId] = useState(locations[0]?.id ?? "");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");

  async function openForm() {
    setOpen(true);
    if (!services.length) {
      const [svcRes, staffRes] = await Promise.all([
        fetch(`/api/admin/options?type=services`).then(r => r.json()),
        fetch(`/api/admin/options?type=staff&loc=${locationId}`).then(r => r.json()),
      ]);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setStaff(Array.isArray(staffRes) ? staffRes : []);
    }
  }

  function close() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setName(""); setServiceId(""); setStaffId(""); setDate(""); setTime("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !staffId || !date || !time || !name.trim()) {
      setError("Name, service, stylist, date and time are required.");
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
          customer_name: name.trim(),
          customer_phone: "00000000",
          customer_email: null,
          notes: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "slot_taken"
          ? "That slot is already taken — choose another time."
          : (json.error ?? "Booking failed."));
      } else {
        setSuccess(`Created — ref ${json.reference_code}`);
        router.refresh();
        setTimeout(close, 2500);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const lbl = "block font-mono text-xs uppercase tracking-widest text-muted-fg mb-1";
  const inp = "w-full border border-border bg-bg px-3 py-2.5 font-mono text-sm text-fg focus:border-fg focus:outline-none";

  return (
    <>
      <button
        onClick={openForm}
        className="shrink-0 border border-fg px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
      >
        + New
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={close}
        >
          <div
            className="w-full sm:max-w-md border border-border bg-bg p-5 sm:p-6"
            style={{ maxHeight: "95dvh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg uppercase tracking-wide text-fg">New booking</p>
              <button onClick={close} className="font-mono text-xs uppercase tracking-widest text-muted-fg hover:opacity-70">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Client name */}
              <div>
                <label className={lbl}>Client name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  className={inp}
                />
              </div>

              {/* Service */}
              <div>
                <label className={lbl}>Service *</label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} className={inp}>
                  <option value="">Select service…</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Stylist */}
              <div>
                <label className={lbl}>Stylist *</label>
                <select value={staffId} onChange={e => setStaffId(e.target.value)} className={inp}>
                  <option value="">Select stylist…</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Date + Time side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Time *</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inp} />
                </div>
              </div>

              {error && <p className="font-mono text-xs uppercase tracking-widest text-warning">{error}</p>}
              {success && <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--success)" }}>{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="border border-fg px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas disabled:opacity-50"
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
