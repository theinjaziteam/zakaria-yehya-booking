"use client";

import { useState } from "react";

type Category = { id: string; name: string };
type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  active: boolean;
  sort_order: number;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function ServiceRow({ svc, onChange }: { svc: Service; onChange: (updated: Service) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState(svc.name);
  const [price, setPrice] = useState(String(svc.price_cents));
  const [duration, setDuration] = useState(String(svc.duration_min));
  const [description, setDescription] = useState(svc.description ?? "");
  const [active, setActive] = useState(svc.active);

  async function save() {
    setSaving(true); setErr(null);
    const price_cents = parseInt(price, 10);
    const duration_min = parseInt(duration, 10);
    if (isNaN(price_cents) || price_cents < 0) { setErr("Invalid price"); setSaving(false); return; }
    if (isNaN(duration_min) || duration_min < 5) { setErr("Duration min 5"); setSaving(false); return; }

    const res = await fetch(`/api/admin/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price_cents, duration_min, description: description || null, active }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setErr(json.error ?? "Failed"); return; }
    onChange({ ...svc, name, price_cents, duration_min, description: description || null, active });
    setEditing(false);
  }

  function cancel() {
    setName(svc.name); setPrice(String(svc.price_cents)); setDuration(String(svc.duration_min));
    setDescription(svc.description ?? ""); setActive(svc.active);
    setEditing(false); setErr(null);
  }

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg";
  const inp = "border border-border bg-bg px-2 py-1.5 font-mono text-sm text-fg focus:outline-none focus:border-fg w-full";

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4 border border-border bg-card px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-display text-base uppercase tracking-wide text-fg">{svc.name}</p>
            {!svc.active && (
              <span className="font-mono text-xs border border-border px-2 py-0.5 text-muted-fg">Inactive</span>
            )}
          </div>
          <p className={`${label} mt-0.5`}>
            {svc.duration_min} min · {formatPrice(svc.price_cents)}
          </p>
          {svc.description && <p className="font-mono text-xs text-muted-fg mt-0.5 opacity-70 truncate">{svc.description}</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          className={`${label} shrink-0 transition-opacity hover:opacity-70`}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="border border-fg bg-card px-5 py-4 grid gap-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <p className={`${label} mb-1`}>Name</p>
          <input value={name} onChange={e => setName(e.target.value)} className={inp} />
        </div>
        <div>
          <p className={`${label} mb-1`}>Price (cents)</p>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className={inp} />
        </div>
        <div>
          <p className={`${label} mb-1`}>Duration (min)</p>
          <input type="number" min="5" step="5" value={duration} onChange={e => setDuration(e.target.value)} className={inp} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <p className={`${label} mb-1`}>Description (optional)</p>
          <input value={description} onChange={e => setDescription(e.target.value)} className={inp} placeholder="Brief description…" />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            type="button"
            onClick={() => setActive(a => !a)}
            className="w-8 h-4 rounded-full flex items-center transition-colors shrink-0"
            style={{ background: active ? "var(--accent)" : "var(--hairline)", padding: "2px" }}
          >
            <span className="block w-3 h-3 rounded-full bg-white transition-transform"
              style={{ transform: active ? "translateX(16px)" : "translateX(0)" }} />
          </button>
          <span className={label}>{active ? "Active" : "Inactive"}</span>
        </label>
        <div className="flex items-center gap-2 ml-auto">
          {err && <p className={`${label} text-warning`}>{err}</p>}
          <button onClick={cancel} className={`${label} transition-opacity hover:opacity-70`}>Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            className="h-8 px-4 font-mono text-xs uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--canvas)", borderRadius: "var(--radius-pill)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ServicesEditor({ initialCategories, initialServices }: {
  initialCategories: Category[];
  initialServices: Service[];
}) {
  const [services, setServices] = useState<Service[]>(initialServices);

  function updateService(updated: Service) {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
  }

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg";

  return (
    <div className="grid gap-8">
      {initialCategories.map(cat => {
        const catServices = services.filter(s => s.category_id === cat.id);
        if (catServices.length === 0) return null;
        return (
          <div key={cat.id}>
            <p className={`${label} mb-3`}>{cat.name} · {catServices.length}</p>
            <div className="grid gap-2">
              {catServices.map(svc => (
                <ServiceRow key={svc.id} svc={svc} onChange={updateService} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
