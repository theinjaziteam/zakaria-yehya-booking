const STEP_LABELS = [
  "Service",
  "Stylist",
  "Date",
  "Time",
  "Details",
];

export function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-5xl items-center gap-0 overflow-x-auto px-md sm:px-xl">
        {STEP_LABELS.map((label, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={label} className="flex shrink-0 items-center">
              <div className="flex items-center gap-xs py-sm">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[10px] uppercase tracking-wide"
                  style={{
                    borderColor: done || active ? "var(--fg)" : "var(--hairline)",
                    color: done || active ? "var(--fg)" : "var(--muted)",
                    background: done ? "var(--fg)" : "transparent",
                  }}
                >
                  <span style={{ color: done ? "var(--bg)" : undefined }}>
                    {done ? "✓" : String(i + 1)}
                  </span>
                </span>
                <span
                  className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)]"
                  style={{
                    color:
                      active
                        ? "var(--fg)"
                        : done
                          ? "var(--muted-fg)"
                          : "var(--muted-fg)",
                    opacity: active ? 1 : done ? 0.6 : 0.4,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span
                  className="mx-sm h-px w-6 shrink-0"
                  style={{
                    background:
                      i < currentIndex ? "var(--fg)" : "var(--hairline)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
