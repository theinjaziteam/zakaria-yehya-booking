"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  confirmFormSchema,
  type ConfirmFormValues,
} from "@/lib/booking/validation";

type Props = {
  loc: string;
  svc: string;
  staff: string;
  date: string;
  time: string;
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

export function ConfirmForm({ loc, svc, staff, date, time }: Props) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+961");
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmFormSchema),
  });

  // Pre-fill from localStorage on mount
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSavedCustomer(saved);
      setValue("customer_name", saved.name);
      setValue("customer_email", saved.email);
      setValue("customer_phone", saved.phone);
      setCountryCode(saved.countryCode || "+961");
    }
  }, [setValue]);

  async function onSubmit(values: ConfirmFormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setServerError(null);
    try {
      const rawPhone = `${countryCode}${values.customer_phone.replace(/^0+/, "")}`;

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: loc,
          service_id: svc,
          staff_id: staff,
          date,
          time,
          customer_name: values.customer_name,
          customer_phone: rawPhone,
          customer_email: values.customer_email || null,
          notes: values.notes || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error === "slot_taken") {
          setServerError("That time has just been taken. Please go back and choose another slot.");
        } else {
          setServerError(json.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      // Save customer details for future visits
      saveSaved({
        name: values.customer_name,
        email: values.customer_email || "",
        phone: values.customer_phone,
        countryCode,
      });

      router.push(`/booking/${json.reference_code}`);
    } catch {
      setServerError("A network error occurred. Please try again.");
      submittingRef.current = false;
    }
  }

  const inputBase =
    "w-full border-b border-input bg-transparent py-sm font-body text-[length:var(--body-md-size)] text-fg placeholder:text-muted-fg focus:border-fg focus:outline-none transition-colors";
  const labelBase =
    "font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg";
  const errorBase =
    "mt-xxs font-mono text-[10px] uppercase tracking-widest text-warning";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-lg" noValidate>
      {/* Returning customer banner */}
      {savedCustomer && (
        <div className="flex items-center justify-between border border-border bg-card px-md py-sm">
          <p className={labelBase}>Welcome back, {savedCustomer.name.split(" ")[0]}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("yz_customer");
              setSavedCustomer(null);
              setValue("customer_name", "");
              setValue("customer_email", "");
              setValue("customer_phone", "");
            }}
            className={`${labelBase} transition-opacity hover:opacity-70`}
          >
            Not you?
          </button>
        </div>
      )}

      {/* Name */}
      <div className="grid gap-xs">
        <label className={labelBase}>Full name</label>
        <input
          {...register("customer_name")}
          className={inputBase}
          placeholder="As it appears on your ID"
          autoComplete="name"
        />
        {errors.customer_name && (
          <p className={errorBase}>{errors.customer_name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="grid gap-xs">
        <label className={labelBase}>Phone number</label>
        <div className="flex items-end gap-sm">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="shrink-0 border-b border-input bg-transparent py-sm font-mono text-[length:var(--body-sm-size)] text-fg focus:border-fg focus:outline-none"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            {...register("customer_phone")}
            type="tel"
            className={inputBase}
            placeholder="76 123 456"
            autoComplete="tel-national"
          />
        </div>
        {errors.customer_phone && (
          <p className={errorBase}>{errors.customer_phone.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="grid gap-xs">
        <label className={labelBase}>
          Email address
          <span className="ml-xs text-muted-fg">(to receive confirmation + view booking history)</span>
        </label>
        <input
          {...register("customer_email")}
          type="email"
          className={inputBase}
          placeholder="your@email.com"
          autoComplete="email"
        />
        {errors.customer_email && (
          <p className={errorBase}>{errors.customer_email.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="grid gap-xs">
        <label className={labelBase}>Notes <span className="text-muted-fg">(optional)</span></label>
        <textarea
          {...register("notes")}
          className={`${inputBase} resize-none`}
          rows={2}
          placeholder="Any preferences or details for the stylist"
        />
        {errors.notes && <p className={errorBase}>{errors.notes.message}</p>}
      </div>

      {serverError && (
        <p className="border border-warning bg-card px-md py-sm font-mono text-[10px] uppercase tracking-widest text-warning">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center justify-center border border-accent px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-accent transition-opacity disabled:opacity-50 hover:opacity-70"
        style={{ borderRadius: "var(--radius-pill)" }}
      >
        {isSubmitting ? "Confirming…" : "Confirm reservation"}
      </button>
    </form>
  );
}
