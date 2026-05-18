import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAPS_LINKS: Record<string, string> = {
  verdun: "https://www.google.com/maps/place/Yehia+%26+Zakaria/@33.8835072,35.482611,18z/data=!4m6!3m5!1s0x151f17318abbb91b:0xbb90c0d1bcda0af!8m2!3d33.8831131!4d35.4830562!16s%2Fg%2F11g6nvvjm4",
  achrafieh: "https://www.google.com/maps/search/Yehia+Zakaria+Achrafieh+Beirut",
  kaslik: "https://www.google.com/maps/search/Yehia+Zakaria+Kaslik+Jounieh",
};

type Location = { id: string; slug: string; name: string; address: string; phone: string | null; timezone: string; active: boolean; bookings_count: number; };

async function getLocations(): Promise<Location[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const [locRes, bookRes] = await Promise.all([
      supabase.from("locations").select("id, slug, name, address, phone, timezone, active").order("name"),
      supabase.from("bookings").select("location_id, status"),
    ]);
    const counts = Object.fromEntries((locRes.data ?? []).map((l: {id:string}) => [l.id, (bookRes.data ?? []).filter((b: {location_id:string;status:string}) => b.location_id === l.id && b.status === "confirmed").length]));
    return (locRes.data ?? []).map((l: {id:string;slug:string;name:string;address:string;phone:string|null;timezone:string;active:boolean}) => ({ ...l, bookings_count: counts[l.id] ?? 0 }));
  } catch { return []; }
}

export default async function AdminLocationsPage() {
  const locations = await getLocations();
  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Locations · {locations.length} salons</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => {
          const mapsUrl = MAPS_LINKS[loc.slug] ?? `https://www.google.com/maps/search/${encodeURIComponent(loc.address)}`;
          return (
            <div key={loc.id} className={`border border-border bg-card p-5 grid gap-4 ${!loc.active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-2xl uppercase tracking-wide text-fg">{loc.name}</p>
                <span className={`shrink-0 font-mono text-xs uppercase tracking-widest px-2 py-1 border ${loc.active ? "border-success text-success" : "border-border text-muted-fg"}`}>
                  {loc.active ? "Open" : "Closed"}
                </span>
              </div>
              <div className="grid gap-2 border-t border-border pt-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-0.5">Address</p>
                  <p className="text-sm text-fg">{loc.address}</p>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:opacity-70">Open in Maps →</a>
                </div>
                {loc.phone && <div><p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-0.5">Phone</p><a href={`tel:${loc.phone}`} className="text-sm text-fg">{loc.phone}</a></div>}
                <div><p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-0.5">Timezone</p><p className="text-sm text-fg">{loc.timezone}</p></div>
              </div>
              <div className="border border-border bg-bg p-3 text-center">
                <p className="font-display text-2xl uppercase tracking-wide text-fg">{loc.bookings_count}</p>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">Confirmed bookings</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
