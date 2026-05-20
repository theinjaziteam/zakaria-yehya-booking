"use client";

import { useRouter } from "next/navigation";
import type { Slot } from "@/lib/booking/slots";
import { formatInTimeZone } from "date-fns-tz";
import { clientConfig } from "@/config/client";

type Props = {
  slots: Slot[] | null;
  svc: string;
  staff: string;
  date: string;
};

const TZ = clientConfig.business.defaultTimezone;

export function TimePicker({ slots, svc, staff, date }: Props) {
  const router = useRouter();

  if (slots === null) {
    return (
      <div className="border border-border bg-card p-md">
        <p className="font-display text-[length:var(--title-md-size)] uppercase tracking-[var(--title-md-tracking)] text-fg">
          All slots are booked.
        </p>
        <p className="mt-xs text-[length:var(--body-sm-size)] leading-relaxed text-muted-fg">
          This date is fully booked. Go back and choose another date, or call us to check for cancellations.
        </p>
      </div>
    );
  }

  const available = slots.filter((s) => s.available);

  if (available.length === 0) {
    return (
      <div className="border border-border bg-card p-md">
        <p className="font-display text-[length:var(--title-md-size)] uppercase tracking-[var(--title-md-tracking)] text-fg">
          No availability on this date.
        </p>
        <p className="mt-xs text-[length:var(--body-sm-size)] leading-relaxed text-muted-fg">
          The selected stylist has no open slots on this day. Go back and try a different date or choose "Next available" to see all stylists.
        </p>
      </div>
    );
  }

  function handleSlotClick(slot: Slot) {
    const time = formatInTimeZone(new Date(slot.starts_at), TZ, "HH:mm");
    router.push(
      `/book/confirm?svc=${svc}&staff=${staff}&date=${date}&time=${time}`,
    );
  }

  return (
    <div className="grid grid-cols-3 gap-xs sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const time = formatInTimeZone(new Date(slot.starts_at), TZ, "HH:mm");
        return (
          <button
            key={slot.starts_at}
            onClick={() => slot.available && handleSlotClick(slot)}
            disabled={!slot.available}
            className="border py-sm text-center font-mono text-[length:var(--nav-size)] uppercase tracking-[var(--nav-tracking)] transition-colors"
            style={{
              borderColor: slot.available ? "var(--hairline)" : "transparent",
              color: slot.available ? "var(--fg)" : "var(--muted-fg)",
              background: slot.available ? "var(--surface-card)" : "transparent",
              opacity: slot.available ? 1 : 0.3,
              cursor: slot.available ? "pointer" : "default",
            }}
            onMouseEnter={(e) => {
              if (slot.available)
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--fg)";
            }}
            onMouseLeave={(e) => {
              if (slot.available)
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--hairline)";
            }}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
