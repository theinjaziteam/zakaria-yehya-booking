"use client";

import { useState } from "react";
import { ClientHistoryModal } from "@/components/client-history-modal";

export function ClientHistoryButton({ name, phone }: { name: string; phone: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left hover:opacity-70 transition-opacity"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <p className="font-medium text-fg underline decoration-border">{name}</p>
        <p className="text-xs text-muted-fg">{phone}</p>
      </button>
      {open && (
        <ClientHistoryModal
          customerName={name}
          customerPhone={phone}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
