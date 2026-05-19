import Link from "next/link";
import { clientConfig } from "@/config/client";

const NAV = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/locations", label: "Locations" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-bg text-body">
      <nav
        className="sticky top-0 z-50 border-b border-border bg-bg/95"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-sm px-4 sm:px-6">
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="font-mono text-xs uppercase tracking-widest text-muted-fg hover:text-fg transition-colors">← Site</Link>
            <span className="text-border">|</span>
            <p className="font-display text-base uppercase tracking-widest text-fg">{clientConfig.brand.shortName} Admin</p>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className="shrink-0 rounded px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-fg hover:bg-card hover:text-fg transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
