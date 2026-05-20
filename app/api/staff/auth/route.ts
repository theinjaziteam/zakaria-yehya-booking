import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const COOKIE = "yz_staff_session";

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  if (!pin) return NextResponse.json({ error: "PIN required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const pinHash = btoa(pin.trim());

  const { data, error } = await supabase
    .from("staff")
    .select("id, name, is_owner")
    .eq("pin_hash", pinHash)
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });

  const token = btoa(JSON.stringify({ id: data.id, name: data.name, is_owner: data.is_owner ?? false }));
  const res = NextResponse.json({ ok: true, staffId: data.id, staffName: data.name });
  // Not httpOnly — the dashboard reads it via document.cookie client-side.
  // Path "/" so the cookie is also sent to /api/staff/* routes.
  res.cookies.set(COOKIE, token, { httpOnly: false, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}
