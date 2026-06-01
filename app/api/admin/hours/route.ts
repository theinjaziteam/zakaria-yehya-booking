import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("yz_admin_session")?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try { return atob(token) === process.env.ADMIN_PASSWORD; } catch { return false; }
}

// PUT /api/admin/hours — replace all working hours for a staff member
export async function PUT(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { staff_id, location_id, hours } = await req.json();
  if (!staff_id || !location_id || !Array.isArray(hours)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Delete existing rows for this staff+location
  await supabase.from("working_hours").delete().eq("staff_id", staff_id).eq("location_id", location_id);

  // Insert new rows (only days where start < end)
  const rows = (hours as { day_of_week: number; start_time: string; end_time: string; closed: boolean }[])
    .filter((h) => !h.closed && h.start_time && h.end_time && h.start_time < h.end_time)
    .map((h) => ({ staff_id, location_id, day_of_week: h.day_of_week, start_time: h.start_time, end_time: h.end_time }));

  if (rows.length > 0) {
    const { error } = await supabase.from("working_hours").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
