"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
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
      {loading ? "…" : "Delete"}
    </button>
  );
}
