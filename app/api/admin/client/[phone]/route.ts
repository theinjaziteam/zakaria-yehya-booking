import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone } = await params;
  const supabase = createAdminSupabaseClient();

  const [bookingsRes, penaltiesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, reference_code, starts_at, status, services(name, price_cents), staff(name)")
      .eq("customer_phone", decodeURIComponent(phone))
      .order("starts_at", { ascending: false })
      .limit(50),
    supabase
      .from("penalties")
      .select("id, type, amount_cents, note, created_at, staff(name)")
      .eq("customer_phone", decodeURIComponent(phone))
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    bookings: bookingsRes.data ?? [],
    penalties: penaltiesRes.data ?? [],
  });
}
