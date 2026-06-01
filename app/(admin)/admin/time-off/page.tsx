export const dynamic = "force-dynamic";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TimeOffManager } from "@/components/admin/time-off-manager";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Beirut";

type StaffRow = { id: string; name: string };
type TimeOffRow = { id: string; staff_id: string; starts_at: string; ends_at: string; reason: string | null; staff: { name: string } | null };

export default async function AdminTimeOffPage() {
  const supabase = createAdminSupabaseClient();

  const [staffRes, timeOffRes] = await Promise.all([
    supabase.from("staff").select("id, name").eq("active", true).order("sort_order"),
    supabase.from("time_off").select("id, staff_id, starts_at, ends_at, reason, staff(name)").order("starts_at", { ascending: false }).limit(200),
  ]);

  const staff = (staffRes.data ?? []) as StaffRow[];
  const timeOff = (timeOffRes.data ?? []) as unknown as TimeOffRow[];

  const rows = timeOff.map(t => ({
    ...t,
    starts_fmt: formatInTimeZone(new Date(t.starts_at), TZ, "EEE d MMM yyyy · HH:mm"),
    ends_fmt: formatInTimeZone(new Date(t.ends_at), TZ, "EEE d MMM yyyy · HH:mm"),
    staff_name: (t.staff as { name: string } | null)?.name ?? staff.find(s => s.id === t.staff_id)?.name ?? "—",
  }));

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Time Off</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mt-1">Block dates for vacation, sick leave, or closure</p>
      </div>
      <TimeOffManager staff={staff} initialRows={rows} />
    </div>
  );
}
