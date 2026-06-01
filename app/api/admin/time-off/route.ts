import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("yz_admin_session")?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try { return atob(token) === process.env.ADMIN_PASSWORD; } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { staff_id, starts_at, ends_at, reason } = await req.json();
  if (!staff_id || !starts_at || !ends_at) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("time_off")
    .insert({ staff_id, starts_at, ends_at, reason: reason || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("time_off").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
