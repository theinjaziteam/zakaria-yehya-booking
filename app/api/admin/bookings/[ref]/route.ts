import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> },
) {
  const { ref } = await params;
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("reference_code", ref.toUpperCase());
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
