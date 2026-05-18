"use client";

import { useRouter } from "next/navigation";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isBefore,
  isAfter,
  parseISO,
  getDay,
  isToday,
} from "date-fns";
import { useState } from "react";
import type { AvailableDay } from "@/lib/booking/slots";

type Props = {
  loc: string;
  svc: string;
  staff: string;
  from: string;
  to: string;
  availableDays: AvailableDay[] | null;
};

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePicker({ loc, svc, staff, from, to, availableDays }: Props) {
  const router = useRouter();
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  const [month, setMonth] = useState(() => startOfMonth(fromDate));

  const prevMonth = subMonths(month, 1);
  const nextMonth = addMonths(month, 1);
  const canGoPrev = !isBefore(startOfMonth(prevMonth), startOfMonth(fromDate));
  const canGoNext = !isAfter(startOfMonth(nextMonth), startOfMonth(toDate));

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function isDayAvailable(day: Date): boolean {
    if (isBefore(day, fromDate) || isAfter(day, toDate)) return false;
    if (getDay(day) === 0) return false; // closed Sundays
    if (availableDays === null) return true;
    const key = format(day, "yyyy-MM-dd");
    const found = availableDays.find((d) => d.date === key);
    if (!found) return false;
    return found.available !== false;
  }

  function handleDayClick(day: Date) {
    if (!isDayAvailable(day)) return;
    const dateStr = format(day, "yyyy-MM-dd");
    router.push(
      `/book/time?loc=${loc}&svc=${svc}&staff=${staff}&date=${dateStr}`,
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "26rem" }}>
      {/* Month navigation */}
      <div className="mb-md flex items-center justify-between">
        <button
          onClick={() => canGoPrev && setMonth(prevMonth)}
          disabled={!canGoPrev}
          className="h-9 w-9 border border-border font-mono text-[length:var(--caption-size)] text-fg transition-opacity disabled:opacity-25 hover:border-fg"
          aria-label="Previous month"
        >
          ←
        </button>
        <p
          className="font-display uppercase text-fg"
          style={{
            fontSize: "var(--title-md-size)",
            letterSpacing: "var(--title-md-tracking)",
          }}
        >
          {format(month, "MMMM yyyy")}
        </p>
        <button
          onClick={() => canGoNext && setMonth(nextMonth)}
          disabled={!canGoNext}
          className="h-9 w-9 border border-border font-mono text-[length:var(--caption-size)] text-fg transition-opacity disabled:opacity-25 hover:border-fg"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-xs grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="py-xs text-center font-mono text-[10px] uppercase tracking-widest text-muted-fg"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const available = inMonth && isDayAvailable(day);
          const today = isToday(day);
          const key = format(day, "yyyy-MM-dd");

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              disabled={!available || !inMonth}
              aria-label={inMonth ? format(day, "d MMMM yyyy") : undefined}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                border: "1px solid",
                borderColor: !inMonth
                  ? "transparent"
                  : available
                    ? today
                      ? "var(--fg)"
                      : "var(--hairline)"
                    : "transparent",
                background: !inMonth
                  ? "transparent"
                  : available
                    ? "var(--surface-card)"
                    : "transparent",
                color: !inMonth
                  ? "transparent"
                  : available
                    ? "var(--fg)"
                    : "var(--muted-fg)",
                opacity: !inMonth ? 0 : available ? 1 : 0.25,
                cursor: available && inMonth ? "pointer" : "default",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--body-sm-size)",
              }}
              onMouseEnter={(e) => {
                if (available && inMonth) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--fg)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-elevated)";
                }
              }}
              onMouseLeave={(e) => {
                if (available && inMonth) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = today ? "var(--fg)" : "var(--hairline)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-card)";
                }
              }}
            >
              {inMonth && (
                <>
                  <span>{format(day, "d")}</span>
                  {today && (
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "block",
                      }}
                    />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {availableDays === null && (
        <p className="mt-md font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg">
          Connect Supabase to see real-time availability
        </p>
      )}
    </div>
  );
}
