import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Beirut";

function getStaffId(req: NextRequest): string | null {
  const cookie = req.cookies.get("yz_staff_session")?.value;
  if (!cookie) return null;
  try { return JSON.parse(atob(cookie)).id ?? null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const staffId = getStaffId(req);
  if (!staffId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const filter = req.nextUrl.searchParams.get("filter") ?? "today";
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("bookings")
    .select("id, reference_code, customer_name, customer_phone, starts_at, ends_at, status, notes, services(name, price_cents), locations(name)")
    .eq("staff_id", staffId)
    .order("starts_at", { ascending: true });

  if (filter === "today") {
    const todayLocal = formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
    const { fromZonedTime } = await import("date-fns-tz");
    const start = fromZonedTime(new Date(`${todayLocal}T00:00:00`), TZ).toISOString();
    const end   = fromZonedTime(new Date(`${todayLocal}T23:59:59`), TZ).toISOString();
    query = query.gte("starts_at", start).lte("starts_at", end);
  } else if (filter === "upcoming") {
    query = query.gte("starts_at", new Date().toISOString()).eq("status", "confirmed");
  }

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
