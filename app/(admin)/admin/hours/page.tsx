export const dynamic = "force-dynamic";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { HoursEditor } from "@/components/admin/hours-editor";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type StaffRow = { id: string; name: string; title: string | null };
type WorkingHour = { staff_id: string; location_id: string; day_of_week: number; start_time: string; end_time: string };
type Location = { id: string; name: string };

export default async function AdminHoursPage() {
  const supabase = createAdminSupabaseClient();

  const [staffRes, locRes, hoursRes] = await Promise.all([
    supabase.from("staff").select("id, name, title").eq("active", true).order("sort_order"),
    supabase.from("locations").select("id, name").eq("active", true),
    supabase.from("working_hours").select("staff_id, location_id, day_of_week, start_time, end_time"),
  ]);

  const staff = (staffRes.data ?? []) as StaffRow[];
  const locations = (locRes.data ?? []) as Location[];
  const hours = (hoursRes.data ?? []) as WorkingHour[];

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Working Hours</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mt-1">Set each stylist&apos;s available hours per day</p>
      </div>
      <HoursEditor staff={staff} locations={locations} hours={hours} days={DAYS} />
    </div>
  );
}
