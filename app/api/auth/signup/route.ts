import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json() as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        return NextResponse.json({ ok: true, existing: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sign up failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
