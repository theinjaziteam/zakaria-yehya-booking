import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

async function checkAdmin() {
  const jar = await cookies();
  const token = jar.get("yz_admin_session")?.value;
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  try { return atob(token) === process.env.ADMIN_PASSWORD; } catch { return false; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const allowed = ["name", "price_cents", "duration_min", "description", "active", "sort_order"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("services").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
