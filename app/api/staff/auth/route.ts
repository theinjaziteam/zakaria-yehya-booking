import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const COOKIE = "yz_staff_session";

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json().catch(() => ({ name: "", pin: "" }));
  if (!name || !pin) return NextResponse.json({ error: "Name and PIN required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const pinHash = btoa(pin.trim()); // simple — good enough for internal tool

  const { data } = await supabase
    .from("staff")
    .select("id, name, is_owner")
    .ilike("name", `%${name.trim()}%`)
    .eq("pin_hash", pinHash)
    .eq("active", true)
    .single();

  if (!data) return NextResponse.json({ error: "Name or PIN incorrect." }, { status: 401 });

  const token = btoa(JSON.stringify({ id: data.id, name: data.name, is_owner: data.is_owner ?? false }));
  const res = NextResponse.json({ ok: true, staffId: data.id, staffName: data.name });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/staff", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
