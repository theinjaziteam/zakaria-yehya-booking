"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 800);
  }

  return (
    <button
      onClick={handleRefresh}
      className="shrink-0 border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest text-muted-fg transition-colors hover:border-fg hover:text-fg"
      title="Refresh bookings"
    >
      {spinning ? "↻ …" : "↻ Refresh"}
    </button>
  );
}
