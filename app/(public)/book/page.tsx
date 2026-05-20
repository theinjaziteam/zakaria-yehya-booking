import { redirect } from "next/navigation";
import { clientConfig } from "@/config/client";

export default async function BookEntryPage() {
  const slug = clientConfig.presentation.locationOrder[0] ?? "verdun";

  // Try to resolve the real Supabase location ID for this slug
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server");
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", slug)
        .eq("active", true)
        .single();
      if (data?.id) redirect(`/book/service?loc=${data.id}`);
    } catch { /* fall through to demo */ }
  }

  redirect(`/book/service?loc=demo-${slug}`);
}
