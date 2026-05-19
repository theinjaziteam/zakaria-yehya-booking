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
  const [showPassword, setShowPassword] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null); // active Supabase session email
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmFormSchema),
  });

  // On mount: check for active session first, then fall back to localStorage
  useEffect(() => {
    async function init() {
      // 1. Try to restore active Supabase session
      try {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setSessionEmail(session.user.email);
          setValue("customer_email", session.user.email);
          // customer_password not needed — skip validation for this field
        }
      } catch {
        // Supabase not configured — fall through to localStorage
      }

      // 2. Pre-fill name/phone from localStorage regardless of auth state
      const saved = loadSaved();
      if (saved) {
        setSavedCustomer(saved);
        setValue("customer_name", saved.name);
        setValue("customer_phone", saved.phone);
        setCountryCode(saved.countryCode || "+961");
        // Only use saved email if not already set from session
        if (!sessionEmail) {
          setValue("customer_email", saved.email);
        }
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValue]);

  async function handleSignOut() {
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setSessionEmail(null);
    setValue("customer_email", savedCustomer?.email ?? "");
  }

  async function onSubmit(values: ConfirmFormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setServerError(null);

    try {
      // Auth: only needed for new/guest users — skip if already signed in
      if (!sessionEmail) {
        const password = values.customer_password ?? "";
        if (password.length >= 6) {
          try {
            const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
            const supabase = createBrowserSupabaseClient();
            const { error: signInErr } = await supabase.auth.signInWithPassword({
              email: values.customer_email,
              password,
            });
            if (signInErr) {
              await supabase.auth.signUp({ email: values.customer_email, password });
            }
          } catch { /* Supabase not configured — proceed anyway */ }
        }
      }

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
          customer_email: values.customer_email,
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
        submittingRef.current = false;
        return;
      }

      saveSaved({
        name: values.customer_name,
        email: values.customer_email,
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

      {/* ── Already signed in ─────────────────────────────────────── */}
      {sessionEmail ? (
        <div className="flex items-center justify-between border border-border bg-card px-md py-sm">
          <div>
            <p className={labelBase}>Signed in</p>
            <p className="mt-xxs text-fg" style={{ fontSize: "var(--body-sm-size)" }}>
              {sessionEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className={`${labelBase} transition-opacity hover:opacity-70`}
          >
            Not you?
          </button>
        </div>
      ) : (
        /* ── New / guest user — show account section ──────────────── */
        <>
          {/* Welcome back from localStorage */}
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

          <div className="grid gap-xs border-b border-border pb-lg">
            <p className={`${labelBase} mb-xs`}>Your account</p>

            {/* Email */}
            <div className="grid gap-xs">
              <label className={labelBase}>Email address</label>
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

            {/* Password */}
            <div className="grid gap-xs">
              <label className={labelBase}>Password</label>
              <div className="relative">
                <input
                  {...register("customer_password")}
                  type={showPassword ? "text" : "password"}
                  className={`${inputBase} pr-16`}
                  placeholder="New or existing password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-0 bottom-sm ${labelBase} transition-opacity hover:opacity-70`}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.customer_password && (
                <p className={errorBase}>{errors.customer_password.message}</p>
              )}
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-fg">
                New here? This creates your account. Already have one? We sign you in.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Name ──────────────────────────────────────────────────── */}
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

      {/* ── Phone ─────────────────────────────────────────────────── */}
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

      {/* ── Notes ─────────────────────────────────────────────────── */}
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
        className="inline-flex h-12 items-center justify-center px-8 font-mono text-[length:var(--button-size)] uppercase tracking-[var(--button-tracking)] transition-opacity disabled:opacity-50 hover:opacity-80"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "var(--accent)",
          color: "var(--canvas)",
        }}
      >
        {isSubmitting ? "Confirming…" : "Confirm reservation"}
      </button>
    </form>
  );
}
