"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const COUNTRY_CODES = [
  { code: "+961", label: "LB +961" },
  { code: "+966", label: "SA +966" },
  { code: "+971", label: "AE +971" },
  { code: "+974", label: "QA +974" },
  { code: "+965", label: "KW +965" },
  { code: "+973", label: "BH +973" },
  { code: "+968", label: "OM +968" },
  { code: "+20", label: "EG +20" },
  { code: "+33", label: "FR +33" },
  { code: "+44", label: "GB +44" },
  { code: "+1", label: "US +1" },
];

export function ConfirmForm({ loc, svc, staff, date, time }: Props) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+961");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmFormSchema),
  });

  async function onSubmit(values: ConfirmFormValues) {
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
          setServerError(
            "That time has just been taken. Please go back and choose another slot.",
          );
        } else {
          setServerError(
            json.error ?? "Something went wrong. Please try again.",
          );
        }
        return;
      }

      router.push(`/booking/${json.reference_code}`);
    } catch {
      setServerError("A network error occurred. Please try again.");
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
              <option key={c.code} value={c.code} style={{ background: "var(--canvas)" }}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            {...register("customer_phone")}
            type="tel"
            className={`${inputBase} flex-1`}
            placeholder="70 000 000"
            autoComplete="tel-national"
          />
        </div>
        {errors.customer_phone && (
          <p className={errorBase}>{errors.customer_phone.message}</p>
        )}
      </div>

      {/* Email (optional) */}
      <div className="grid gap-xs">
        <label className={labelBase}>Email address (optional)</label>
        <input
          {...register("customer_email")}
          type="email"
          className={inputBase}
          placeholder="For confirmation details"
          autoComplete="email"
        />
        {errors.customer_email && (
          <p className={errorBase}>{errors.customer_email.message}</p>
        )}
      </div>

      {/* Notes (optional) */}
      <div className="grid gap-xs">
        <label className={labelBase}>Notes (optional)</label>
        <textarea
          {...register("notes")}
          className={`${inputBase} resize-none`}
          rows={3}
          placeholder="Anything the stylist should know beforehand"
        />
        {errors.notes && (
          <p className={errorBase}>{errors.notes.message}</p>
        )}
      </div>

      {serverError && (
        <div className="border border-warning bg-card px-md py-sm">
          <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-warning">
            {serverError}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-md pt-xs">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center border border-accent px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] text-accent transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          {isSubmitting ? "Placing reservation…" : "Confirm reservation"}
        </button>
        <p className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
          No payment required now
        </p>
      </div>

      <p className="text-[length:var(--body-sm-size)] leading-relaxed text-muted-fg">
        By confirming, you agree that a cancellation with less than four hours notice may be noted on your booking record.
      </p>
    </form>
  );
}
