"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handle}
          disabled={loading}
          className="font-mono text-xs uppercase tracking-widest px-2 py-1 bg-warning text-canvas border border-warning disabled:opacity-50"
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-mono text-xs uppercase tracking-widest px-2 py-1 border border-border text-muted-fg hover:border-fg"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 font-mono text-xs uppercase tracking-widest px-3 py-1.5 border border-border text-muted-fg transition-colors hover:border-warning hover:text-warning"
    >
      Cancel
    </button>
  );
}
