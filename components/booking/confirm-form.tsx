"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { confirmFormSchema, type ConfirmFormValues } from "@/lib/booking/validation";
import { useAuth } from "@/components/auth-provider";
import type { Product } from "@/components/products-section";
import { loadPendingProducts, clearPendingProducts } from "@/components/products-section";

type Props = {
  loc: string;
  svc: string;
  staff: string;
  date: string;
  time: string;
  products: Product[];
  servicePriceCents: number;
};

type SavedCustomer = { name: string; email: string; phone: string; countryCode: string };

const COUNTRY_CODES = [
  { code: "+961", label: "LB +961" },
  { code: "+966", label: "SA +966" },
  { code: "+971", label: "AE +971" },
  { code: "+974", label: "QA +974" },
  { code: "+965", label: "KW +965" },
  { code: "+973", label: "BH +973" },
  { code: "+968", label: "OM +968" },
  { code: "+20",  label: "EG +20"  },
  { code: "+33",  label: "FR +33"  },
  { code: "+44",  label: "GB +44"  },
  { code: "+1",   label: "US +1"   },
];

function loadSaved(): SavedCustomer | null {
  try {
    const raw = localStorage.getItem("yz_customer");
    return raw ? (JSON.parse(raw) as SavedCustomer) : null;
  } catch { return null; }
}

function saveSaved(data: SavedCustomer) {
  try { localStorage.setItem("yz_customer", JSON.stringify(data)); } catch { /* ignore */ }
}

function fmt(cents: number) { return `$${(cents / 100).toFixed(0)}`; }

export function ConfirmForm({ loc, svc, staff, date, time, products, servicePriceCents }: Props) {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const sessionEmail = user?.email ?? null;

  const [countryCode, setCountryCode] = useState("+961");
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // product add-ons: productId -> quantity
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({ resolver: zodResolver(confirmFormSchema) });

  useEffect(() => {
    if (sessionEmail) setValue("customer_email", sessionEmail);

    const saved = loadSaved();
    // Only use saved localStorage details if they belong to the current session user
    // (or there is no session — pure guest flow). Prevents showing "Welcome back, Ryan"
    // to a different signed-in user.
    const savedMatchesSession = saved && (!sessionEmail || saved.email === sessionEmail);
    if (savedMatchesSession) {
      setSavedCustomer(saved);
      setValue("customer_name", saved.name);
      setValue("customer_phone", saved.phone);
      setCountryCode(saved.countryCode || "+961");
      if (!sessionEmail) setValue("customer_email", saved.email);
    }

    // Pre-select any products tapped on the landing page
    const pending = loadPendingProducts();
    if (pending.length > 0 && products.length > 0) {
      const initial: Record<string, number> = {};
      for (const p of pending) {
        if (products.find((pr) => pr.id === p.product_id)) {
          initial[p.product_id] = p.quantity;
        }
      }
      if (Object.keys(initial).length > 0) setAddOns(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmail, setValue]);

  function setAddonQty(productId: string, qty: number) {
    setAddOns((prev) => {
      if (qty <= 0) { const n = { ...prev }; delete n[productId]; return n; }
      return { ...prev, [productId]: qty };
    });
  }

  const addonItems = products
    .filter((p) => (addOns[p.id] ?? 0) > 0)
    .map((p) => ({
      product_id: p.id,
      product_name: p.name,
      quantity: addOns[p.id]!,
      unit_price_cents: p.price_cents,
    }));

  const addonTotal = addonItems.reduce((s, i) => s + i.quantity * i.unit_price_cents, 0);
  const grandTotal = servicePriceCents + addonTotal;

  async function onSubmit(values: ConfirmFormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setServerError(null);

    try {
      // Auth for new/guest users — use admin API so no confirmation email is sent
      if (!sessionEmail) {
        const password = values.customer_password ?? "";
        if (password.length >= 6) {
          try {
            await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: values.customer_email, password }),
            });
            const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
            await createBrowserSupabaseClient().auth.signInWithPassword({ email: values.customer_email, password });
          } catch { /* proceed — booking still goes through */ }
        }
      }

      const rawPhone = `${countryCode}${values.customer_phone.replace(/^0+/, "")}`;

      // Create booking
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: loc, service_id: svc, staff_id: staff, date, time,
          customer_name: values.customer_name,
          customer_phone: rawPhone,
          customer_email: values.customer_email,
          notes: values.notes || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error === "slot_taken"
          ? "That time has just been taken. Please go back and choose another slot."
          : (json.error ?? "Something went wrong. Please try again."));
        submittingRef.current = false;
        return;
      }

      // Create product order (best-effort — don't block the booking on failure)
      if (addonItems.length > 0) {
        fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: values.customer_name,
            customer_phone: rawPhone,
            customer_email: values.customer_email,
            items: addonItems,
          }),
        }).catch(() => { /* silent */ });
      }

      saveSaved({ name: values.customer_name, email: values.customer_email, phone: values.customer_phone, countryCode });
      clearPendingProducts();
      router.push(`/booking/${json.reference_code}`);
    } catch {
      setServerError("A network error occurred. Please try again.");
      submittingRef.current = false;
    }
  }

  const inputBase = "w-full border-b border-input bg-transparent py-sm font-body text-[length:var(--body-md-size)] text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelBase = "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";
  const errorBase = "mt-xxs font-mono text-[10px] uppercase tracking-widest text-warning";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-lg" noValidate>

      {/* ── Auth state ────────────────────────────────────── */}
      {!authLoading && sessionEmail && (
        <div className="flex items-center justify-between border border-border bg-card px-md py-sm">
          <div>
            <p className={labelBase}>Booking as</p>
            <p className="mt-xxs text-fg" style={{ fontSize: "var(--body-sm-size)" }}>{sessionEmail}</p>
          </div>
          <button type="button" onClick={() => signOut()} className={`${labelBase} transition-opacity hover:opacity-70`}>
            Sign out
          </button>
        </div>
      )}

      {!authLoading && !sessionEmail && (
        <div className="grid gap-xs border-b border-border pb-lg">
          <div className="grid gap-xs">
            <label className={labelBase}>Email</label>
            <input {...register("customer_email")} type="email" className={inputBase} placeholder="your@email.com" autoComplete="email" inputMode="email" />
            {errors.customer_email && <p className={errorBase}>{errors.customer_email.message}</p>}
          </div>
          <div className="grid gap-xs">
            <label className={labelBase}>Password</label>
            <div className="relative">
              <input {...register("customer_password")} type={showPassword ? "text" : "password"} className={`${inputBase} pr-16`} placeholder="New or existing" autoComplete="current-password" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className={`absolute right-0 bottom-sm ${labelBase} transition-opacity hover:opacity-70`}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.customer_password && <p className={errorBase}>{errors.customer_password.message}</p>}
          </div>
        </div>
      )}

      {/* ── Name ─────────────────────────────────────────── */}
      <div className="grid gap-xs">
        <label className={labelBase}>Full name</label>
        <input {...register("customer_name")} className={inputBase} placeholder="As it appears on your ID" autoComplete="name" />
        {errors.customer_name && <p className={errorBase}>{errors.customer_name.message}</p>}
      </div>

      {/* ── Phone ────────────────────────────────────────── */}
      <div className="grid gap-xs">
        <label className={labelBase}>Phone number</label>
        <div className="flex items-end gap-sm">
          <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="shrink-0 border-b border-input bg-transparent py-sm font-mono text-[length:var(--body-sm-size)] text-fg focus:border-fg focus:outline-none">
            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
          <input {...register("customer_phone")} type="tel" className={inputBase} placeholder="76 123 456" autoComplete="tel-national" />
        </div>
        {errors.customer_phone && <p className={errorBase}>{errors.customer_phone.message}</p>}
      </div>

      {/* ── Notes ────────────────────────────────────────── */}
      <div className="grid gap-xs">
        <label className={labelBase}>Notes <span className="text-muted-fg">(optional)</span></label>
        <textarea {...register("notes")} className={`${inputBase} resize-none`} rows={2} placeholder="Any preferences or details for the stylist" maxLength={200} />
        {errors.notes && <p className={errorBase}>{errors.notes.message}</p>}
      </div>

      {/* ── Product add-ons ──────────────────────────────── */}
      {products.length > 0 && (
        <div className="grid gap-sm border-t border-border pt-lg">
          <div>
            <p className={labelBase}>Add to your visit</p>
            <p className="mt-xxs font-mono text-[10px] uppercase tracking-widest text-muted-fg">
              Products picked up at the salon on the day
            </p>
          </div>

          <div className="grid gap-0">
            {products.map((p, i) => {
              const qty = addOns[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-md py-sm ${i < products.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-fg truncate" style={{ fontSize: "var(--body-sm-size)" }}>{p.name}</p>
                    <p className="font-mono text-muted-fg" style={{ fontSize: "var(--caption-size)" }}>{fmt(p.price_cents)}</p>
                  </div>
                  <div className="flex items-center gap-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setAddonQty(p.id, qty - 1)}
                      disabled={qty === 0}
                      aria-label={`Remove one ${p.name}`}
                      className="h-7 w-7 border border-border font-mono text-sm text-fg transition-colors hover:bg-fg hover:text-canvas disabled:opacity-30"
                    >−</button>
                    <span className="w-5 text-center font-mono text-sm text-fg" aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setAddonQty(p.id, qty + 1)}
                      aria-label={`Add one ${p.name}`}
                      className="h-7 w-7 border border-border font-mono text-sm text-fg transition-colors hover:bg-fg hover:text-canvas"
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-sm grid gap-0 border-t border-border pt-sm">
            {servicePriceCents > 0 && (
              <div className="flex items-center justify-between py-xxs">
                <p className={labelBase}>Service</p>
                <p className="font-mono text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>{fmt(servicePriceCents)}</p>
              </div>
            )}
            {addonTotal > 0 && (
              <div className="flex items-center justify-between py-xxs">
                <p className={labelBase}>Add-ons</p>
                <p className="font-mono text-muted-fg" style={{ fontSize: "var(--body-sm-size)" }}>{fmt(addonTotal)}</p>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-sm mt-xxs">
              <p className={labelBase}>Total</p>
              <p className="font-mono text-fg font-medium" style={{ fontSize: "var(--body-md-size)" }}>{fmt(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <p className="border border-warning bg-card px-md py-sm font-mono text-[10px] uppercase tracking-widest text-warning">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity disabled:opacity-50 hover:opacity-80"
        style={{ borderRadius: "var(--radius-pill)", background: "var(--accent)", color: "var(--canvas)" }}
      >
        {isSubmitting ? "Confirming…" : grandTotal > 0 ? `Confirm — ${fmt(grandTotal)}` : "Confirm reservation"}
      </button>
    </form>
  );
}
