import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  if (!email && !phone) {
    return NextResponse.json({ error: "email or phone required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("product_orders")
    .select("id, reference_code, customer_name, items, total_cents, status, pickup_date, pickup_time, created_at")
    .neq("customer_phone", "walk-in") // exclude admin walk-in sales
    .order("created_at", { ascending: false })
    .limit(50);

  if (email) {
    query = query.eq("customer_email", email);
  } else if (phone) {
    query = query.eq("customer_phone", phone);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data ?? []);
}
