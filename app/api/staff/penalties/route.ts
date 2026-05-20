import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getStaffId(req: NextRequest): string | null {
  const cookie = req.cookies.get("yz_staff_session")?.value;
  if (!cookie) return null;
  try { return JSON.parse(atob(cookie)).id ?? null; } catch { return null; }
}

// Returns booking_ids that already have a late_arrival penalty for this staff
export async function GET(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("penalties")
    .select("booking_id")
    .eq("staff_id", staffId)
    .eq("type", "late_arrival")
    .not("booking_id", "is", null);
  return NextResponse.json((data ?? []).map((r: { booking_id: string }) => r.booking_id));
}

export async function POST(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { booking_id, customer_phone, customer_name, type, amount_cents, note } = await req.json();
  if (!customer_phone || !customer_name || !type) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  // Prevent duplicate late_arrival penalty on the same booking
  if (type === "late_arrival" && booking_id) {
    const { data: existing } = await supabase
      .from("penalties")
      .select("id")
      .eq("booking_id", booking_id)
      .eq("type", "late_arrival")
      .maybeSingle();
    if (existing) return NextResponse.json({ error: "Already marked." }, { status: 409 });
  }

  const { error } = await supabase.from("penalties").insert({
    booking_id: booking_id ?? null,
    staff_id: staffId,
    customer_phone,
    customer_name,
    type,
    amount_cents: amount_cents ?? 500,
    note: note ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
