import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("yz_admin_session")?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try { return atob(token) === process.env.ADMIN_PASSWORD; } catch { return false; }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string" || pin.length < 4) {
    return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
  }
  if (!/^\d+$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be digits only" }, { status: 400 });
  }

  const pin_hash = await bcrypt.hash(pin, 10);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("staff").update({ pin_hash }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
