import Link from "next/link";
import { clientConfig } from "@/config/client";

const NAV = [
  { href: "/admin", label: "Today" },
  { href: "/admin/bookings", label: "All bookings" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/locations", label: "Locations" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-bg text-body">
      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/95" style={{ backdropFilter: "blur(8px)" }}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-sm px-md sm:px-xl">
          {/* Left */}
          <div className="flex items-center gap-sm sm:gap-lg shrink-0">
            <Link
              href="/"
              className="font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg transition-opacity hover:opacity-70"
            >
              ← Site
            </Link>
            <p className="font-display text-[length:var(--wordmark-size)] uppercase tracking-[var(--wordmark-tracking)] text-fg">
              {clientConfig.brand.shortName} · Admin
            </p>
          </div>

          {/* Nav links — scroll horizontally on mobile */}
          <div className="flex items-center gap-sm sm:gap-md overflow-x-auto shrink min-w-0">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 font-mono text-[length:var(--caption-size)] uppercase tracking-[var(--caption-tracking)] text-muted-fg transition-opacity hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-md py-xl sm:px-xl">
        {children}
      </div>
    </div>
  );
}
