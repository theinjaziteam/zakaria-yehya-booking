"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteBookingButton({ refCode }: { refCode: string }) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    try {
      await fetch(`/api/admin/bookings/${refCode}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`shrink-0 font-mono text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors disabled:opacity-50 ${
        confirmed
          ? "border-warning text-warning"
          : "border-border text-muted-fg hover:border-warning hover:text-warning"
      }`}
    >
      {loading ? "…" : confirmed ? "Sure?" : "Remove"}
    </button>
  );
}
