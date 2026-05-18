"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelBookingButton({ refCode }: { refCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      await fetch(`/api/admin/bookings/${refCode}/cancel`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <button onClick={handleCancel} disabled={loading}
      className={`shrink-0 font-mono text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-50 ${
        confirmed ? "border-warning text-warning" : "border-border text-muted-fg hover:border-warning hover:text-warning"
      }`}>
      {loading ? "…" : confirmed ? "Confirm cancel" : "Cancel"}
    </button>
  );
}
