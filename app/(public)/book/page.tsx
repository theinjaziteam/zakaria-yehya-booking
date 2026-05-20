export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { clientConfig } from "@/config/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function BookEntryPage() {
  const slug = clientConfig.presentation.locationOrder[0] ?? "verdun";

  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", slug)
      .eq("active", true)
      .single();
    if (data?.id) redirect(`/book/service?loc=${data.id}`);
  } catch { /* env vars not set — will never happen in production */ }

  // Should never reach here in production
  redirect(`/book/service?loc=demo-${slug}`);
}
