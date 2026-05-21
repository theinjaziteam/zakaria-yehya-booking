"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; price_cents: number };
type Props = { products: Product[] };

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

export function LogSaleForm({ products }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);

  const selectedProduct = products.find(p => p.id === productId);

  function close() {
    setOpen(false);
    setError(null);
    setSuccess(null);
    setCustomerName("");
    setProductId("");
    setQty(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !customerName.trim()) {
      setError("Name and product are required.");
      return;
    }
    const product = products.find(p => p.id === productId)!;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          product_id: product.id,
          product_name: product.name,
          unit_price_cents: product.price_cents,
          quantity: qty,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Failed.");
        setLoading(false);
        return;
      }

      setSuccess("Sale logged.");
      router.refresh();
      setTimeout(close, 1800);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full border border-border bg-bg px-3 py-2 font-mono text-sm text-fg focus:border-fg focus:outline-none";
  const lbl = "block font-mono text-xs uppercase tracking-widest text-muted-fg mb-1";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 border border-fg px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas"
      >
        + Log sale
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={close}>
          <div className="w-full sm:max-w-sm border border-border bg-bg p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg uppercase tracking-wide text-fg">Log sale</p>
              <button onClick={close} className="font-mono text-xs uppercase tracking-widest text-muted-fg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className={lbl}>Customer name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Walk-in customer" className={inp} autoFocus />
              </div>
              <div>
                <label className={lbl}>Product *</label>
                <select value={productId} onChange={e => setProductId(e.target.value)} className={inp}>
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {fmt(p.price_cents)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Quantity</label>
                <input type="number" min={1} max={20} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} className={inp} />
              </div>
              {selectedProduct && (
                <p className="font-mono text-sm text-fg">Total: {fmt(selectedProduct.price_cents * qty)}</p>
              )}

              {error && <p className="font-mono text-xs uppercase tracking-widest text-warning">{error}</p>}
              {success && <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--success)" }}>{success}</p>}

              <button type="submit" disabled={loading} className="border border-fg px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:bg-fg hover:text-canvas disabled:opacity-50">
                {loading ? "Saving…" : "Save sale"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
