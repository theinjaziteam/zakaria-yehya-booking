import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { StaffPinReset } from "@/components/admin/staff-pin-reset";

type StaffMember = { id: string; name: string; title: string | null; bio: string | null; active: boolean; sort_order: number; pin_hash: string | null; locations: string[]; services: string[]; };

async function getStaff(): Promise<StaffMember[]> {
  try {
    const supabase = createAdminSupabaseClient();
    const [staffRes, staffLocRes, staffSvcRes, locRes, svcRes] = await Promise.all([
      supabase.from("staff").select("id, name, title, bio, active, sort_order, pin_hash").order("sort_order"),
      supabase.from("staff_locations").select("staff_id, location_id"),
      supabase.from("staff_services").select("staff_id, service_id"),
      supabase.from("locations").select("id, name"),
      supabase.from("services").select("id, name"),
    ]);
    const locs = Object.fromEntries((locRes.data ?? []).map((l: {id:string;name:string}) => [l.id, l.name]));
    const svcs = Object.fromEntries((svcRes.data ?? []).map((s: {id:string;name:string}) => [s.id, s.name]));
    return (staffRes.data ?? []).map((s: {id:string;name:string;title:string|null;bio:string|null;active:boolean;sort_order:number;pin_hash:string|null}) => ({
      ...s,
      locations: (staffLocRes.data ?? []).filter((r: {staff_id:string}) => r.staff_id === s.id).map((r: {location_id:string}) => locs[r.location_id] ?? r.location_id),
      services: (staffSvcRes.data ?? []).filter((r: {staff_id:string}) => r.staff_id === s.id).map((r: {service_id:string}) => svcs[r.service_id] ?? r.service_id),
    }));
  } catch { return []; }
}

export default async function AdminStaffPage() {
  const staff = await getStaff();
  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Staff · {staff.length} members</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <div key={s.id} className={`border border-border bg-card p-5 grid gap-3 ${!s.active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-xl uppercase tracking-wide text-fg">{s.name}</p>
                {s.title && <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mt-0.5">{s.title}</p>}
              </div>
              <span className={`shrink-0 font-mono text-xs uppercase tracking-widest px-2 py-1 border ${s.active ? "border-success text-success" : "border-border text-muted-fg"}`}>
                {s.active ? "Active" : "Inactive"}
              </span>
            </div>
            {s.bio && <p className="text-sm text-body leading-relaxed">{s.bio}</p>}
            {s.locations.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Salons</p>
                <div className="flex flex-wrap gap-1">
                  {s.locations.map((l) => <span key={l} className="font-mono text-xs border border-border px-2 py-0.5 text-fg">{l}</span>)}
                </div>
              </div>
            )}
            {s.services.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Services ({s.services.length})</p>
                <div className="flex flex-wrap gap-1">
                  {s.services.slice(0, 4).map((sv) => <span key={sv} className="font-mono text-xs border border-border px-2 py-0.5 text-fg">{sv}</span>)}
                  {s.services.length > 4 && <span className="font-mono text-xs text-muted-fg">+{s.services.length - 4} more</span>}
                </div>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-fg">
                  PIN {s.pin_hash ? "· set" : "· not set"}
                </p>
                <StaffPinReset staffId={s.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
