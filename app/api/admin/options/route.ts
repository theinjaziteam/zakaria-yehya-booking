import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const loc  = req.nextUrl.searchParams.get("loc");
  const supabase = createAdminSupabaseClient();

  if (type === "services") {
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_min, price_cents")
      .eq("active", true)
      .order("sort_order");
    return NextResponse.json(data ?? []);
  }

  if (type === "staff" && loc) {
    const { data: atLoc } = await supabase
      .from("staff_locations")
      .select("staff_id")
      .eq("location_id", loc);
    const ids = (atLoc ?? []).map((r: { staff_id: string }) => r.staff_id);
    if (!ids.length) return NextResponse.json([]);
    const { data } = await supabase
      .from("staff")
      .select("id, name")
      .in("id", ids)
      .eq("active", true)
      .order("sort_order");
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}
