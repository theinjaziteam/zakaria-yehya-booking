import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getStaffId(req: NextRequest): string | null {
  const cookie = req.cookies.get("yz_staff_session")?.value;
  if (!cookie) return null;
  try { return JSON.parse(atob(cookie)).id ?? null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("staff_tips")
    .select("id, customer_name, amount_cents, note, tip_date, booking_id")
    .eq("staff_id", staffId)
    .order("tip_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { customer_name, amount_cents, note, tip_date, booking_id } = await req.json();
  if (!amount_cents || amount_cents <= 0) return NextResponse.json({ error: "Amount required." }, { status: 400 });
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("staff_tips").insert({
    staff_id: staffId,
    customer_name: customer_name || null,
    amount_cents,
    note: note || null,
    tip_date: tip_date || new Date().toISOString().slice(0, 10),
    booking_id: booking_id || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await req.json();
  const supabase = createAdminSupabaseClient();
  await supabase.from("staff_tips").delete().eq("id", id).eq("staff_id", staffId);
  return NextResponse.json({ ok: true });
}
