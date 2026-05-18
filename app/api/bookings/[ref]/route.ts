import { NextRequest, NextResponse } from "next/server";

async function getSupabase() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  return createServerSupabaseClient();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  const supabase = await getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const { data, error } = await (await supabase).rpc("get_booking_by_ref", {
    p_ref: ref.toUpperCase(),
  });

  if (error) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // RPC returns SETOF → Supabase JS gives an array; unwrap the first row
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;

  let body: { phoneLast4?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* no body is fine for simple calls */
  }

  if (!body.phoneLast4 || body.phoneLast4.length !== 4) {
    return NextResponse.json(
      { error: "Provide the last 4 digits of your phone number" },
      { status: 422 },
    );
  }

  const supabase = await getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const { data, error } = await (await supabase).rpc("cancel_booking", {
    p_ref: ref.toUpperCase(),
    p_phone_last4: body.phoneLast4,
  });

  if (error) {
    console.error("cancel_booking error:", error);
    return NextResponse.json(
      { error: "Cancellation failed. Please try again." },
      { status: 500 },
    );
  }

  type CancelResult = { error?: string; success?: boolean };
  const result = data as CancelResult;

  if (result?.error === "not_found") {
    return NextResponse.json(
      { error: "Booking not found or phone number does not match" },
      { status: 404 },
    );
  }

  if (result?.error === "window_closed") {
    return NextResponse.json(
      {
        error:
          "Cancellations must be made at least 4 hours before the appointment.",
      },
      { status: 422 },
    );
  }

  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
