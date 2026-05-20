import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getStaffId(req: NextRequest): string | null {
  const cookie = req.cookies.get("yz_staff_session")?.value;
  if (!cookie) return null;
  try { return JSON.parse(atob(cookie)).id ?? null; } catch { return null; }
}

export async function POST(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { booking_id, customer_phone, customer_name, type, amount_cents, note } = await req.json();
  if (!customer_phone || !customer_name || !type) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
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
