"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FulfillOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFulfill() {
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleFulfill}
      disabled={loading}
      className="shrink-0 font-mono text-xs uppercase tracking-widest px-3 py-1.5 border border-border text-muted-fg transition-colors hover:border-fg hover:text-fg disabled:opacity-50"
    >
      {loading ? "…" : "Fulfil"}
    </button>
  );
}
