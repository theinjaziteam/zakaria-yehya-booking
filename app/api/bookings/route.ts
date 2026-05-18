import { NextRequest, NextResponse } from "next/server";
import { bookingPayloadSchema } from "@/lib/booking/validation";
import { toE164 } from "@/lib/utils/phone";
import { localToUTC } from "@/lib/utils/time";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate payload shape
  const parsed = bookingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Booking payload validation failed:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const payload = parsed.data;

  // Validate + normalise phone to E.164
  const e164 = toE164(payload.customer_phone);
  if (!e164) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 422 },
    );
  }

  // Need Supabase to proceed
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

  // Look up the location's timezone so we can convert the local time to UTC
  const { data: location, error: locErr } = await supabase
    .from("locations")
    .select("timezone")
    .eq("id", payload.location_id)
    .single();

  if (locErr || !location) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const locationTz = (location as { timezone: string }).timezone;

  // Resolve staff_id — if "any", pick first available (simplified: just pick
  // the first staff at that location offering the service)
  let staffId = payload.staff_id;
  if ((staffId as string) === "any") {
    const { data: atLoc } = await supabase
      .from("staff_locations")
      .select("staff_id")
      .eq("location_id", payload.location_id);
    const { data: forSvc } = await supabase
      .from("staff_services")
      .select("staff_id")
      .eq("service_id", payload.service_id);

    type Row = { staff_id: string };
    const atLocIds = (atLoc as Row[] | null ?? []).map((r) => r.staff_id);
    const forSvcIds = (forSvc as Row[] | null ?? []).map((r) => r.staff_id);
    const eligible = atLocIds.filter((id) => forSvcIds.includes(id));

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No staff available for this service at this location" },
        { status: 422 },
      );
    }
    staffId = eligible[0]!;
  }

  // Convert local date+time to UTC ISO
  const startsAt = localToUTC(payload.date, payload.time, locationTz);

  // Call the create_booking SECURITY DEFINER RPC
  const { data: result, error: rpcErr } = await supabase.rpc(
    "create_booking",
    {
      p_payload: {
        location_id: payload.location_id,
        service_id: payload.service_id,
        staff_id: staffId,
        starts_at: startsAt,
        customer_name: payload.customer_name,
        customer_phone: e164,
        customer_email: payload.customer_email ?? null,
        notes: payload.notes ?? null,
      },
    },
  );

  if (rpcErr) {
    console.error("create_booking RPC error:", rpcErr);
    return NextResponse.json(
      { error: "Booking failed. Please try again." },
      { status: 500 },
    );
  }

  type RpcResult = { error?: string; reference_code?: string };
  const rpcResult = result as RpcResult;

  if (rpcResult?.error === "slot_taken") {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  if (!rpcResult?.reference_code) {
    return NextResponse.json(
      { error: "Booking failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { reference_code: rpcResult.reference_code },
    { status: 201 },
  );
}
