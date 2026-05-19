import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const orderSchema = z.object({
  customer_name: z.string().min(2),
  customer_phone: z.string().min(6),
  customer_email: z.string().email(),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      product_name: z.string(),
      quantity: z.number().int().min(1).max(10),
      unit_price_cents: z.number().int().min(0),
    }),
  ).min(1),
  notes: z.string().max(400).optional().nullable(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const payload = parsed.data;
  const total_cents = payload.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_cents,
    0,
  );

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("product_orders").insert({
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    customer_email: payload.customer_email,
    items: payload.items,
    total_cents,
    notes: payload.notes ?? null,
  });

  if (error) {
    console.error("product_orders insert error:", error);
    return NextResponse.json({ error: "Order failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
