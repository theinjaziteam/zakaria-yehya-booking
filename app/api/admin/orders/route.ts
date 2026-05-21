import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// Admin-only: create a walk-in sale — status immediately completed
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { customer_name, product_id, product_name, unit_price_cents, quantity } = body;
  if (!customer_name || !product_id || !product_name || !unit_price_cents || !quantity) {
    return NextResponse.json({ error: "customer_name, product_id, product_name, unit_price_cents, quantity are all required" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const qty = Number(quantity);
  const unitCents = Number(unit_price_cents);

  const { data, error } = await supabase
    .from("product_orders")
    .insert({
      customer_name: String(customer_name),
      customer_phone: "walk-in",
      customer_email: null,
      pickup_date: today,
      pickup_time: "00:00",
      items: [{ product_id, product_name, quantity: qty, unit_price_cents: unitCents }],
      total_cents: unitCents * qty,
      status: "completed",
    })
    .select("id, reference_code")
    .single();

  if (error) {
    console.error("log-sale insert error:", error.message, error.details, error.hint);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, reference_code: data.reference_code }, { status: 201 });
}
