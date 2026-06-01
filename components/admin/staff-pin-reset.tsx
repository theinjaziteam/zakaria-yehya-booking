"use client";

import { useState } from "react";

export function StaffPinReset({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr(null);
    const res = await fetch(`/api/admin/staff/${staffId}/pin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json();
      setErr(json.error ?? "Failed");
      return;
    }
    setDone(true);
    setPin("");
    setTimeout(() => { setDone(false); setOpen(false); }, 1500);
  }

  const label = "font-mono text-xs uppercase tracking-widest text-muted-fg";
  const inp = "border border-border bg-bg px-2 py-1.5 font-mono text-sm text-fg focus:outline-none focus:border-fg w-28 tracking-widest";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`${label} transition-opacity hover:opacity-70`}
      >
        Set PIN
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4,8}"
        maxLength={8}
        placeholder="New PIN"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
        className={inp}
        autoFocus
      />
      {err && <p className={`${label} text-warning`}>{err}</p>}
      {done && <p className={`${label} text-success`}>Saved</p>}
      <button
        type="submit"
        disabled={saving || pin.length < 4}
        className="h-7 px-3 font-mono text-xs uppercase tracking-widest transition-opacity disabled:opacity-50"
        style={{ background: "var(--ink)", color: "var(--canvas)", borderRadius: "var(--radius-pill)" }}
      >
        {saving ? "…" : "Save"}
      </button>
      <button type="button" onClick={() => { setOpen(false); setPin(""); setErr(null); }}
        className={`${label} transition-opacity hover:opacity-70`}>
        Cancel
      </button>
    </form>
  );
}
