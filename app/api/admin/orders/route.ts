import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Admin-only: create a walk-in sale (status = completed immediately)
export async function POST(req: NextRequest) {
  const { customer_name, product_id, product_name, unit_price_cents, quantity } = await req.json().catch(() => ({}));
  if (!customer_name || !product_id || !unit_price_cents || !quantity) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("product_orders")
    .insert({
      customer_name,
      customer_phone: "walk-in",
      customer_email: null,
      pickup_date: today,
      pickup_time: "00:00",
      items: [{ product_id, product_name, quantity, unit_price_cents }],
      total_cents: unit_price_cents * quantity,
      status: "completed",
    })
    .select("id, reference_code")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, reference_code: data.reference_code }, { status: 201 });
}
