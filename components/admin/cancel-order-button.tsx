"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm("Cancel this order?")) return;
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
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="shrink-0 font-mono text-xs uppercase tracking-widest px-3 py-1.5 border border-border text-muted-fg transition-colors hover:border-warning hover:text-warning disabled:opacity-50"
    >
      {loading ? "…" : "Cancel"}
    </button>
  );
}
