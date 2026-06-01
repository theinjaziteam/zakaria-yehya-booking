export const dynamic = "force-dynamic";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ServicesEditor } from "@/components/admin/services-editor";

type Category = { id: string; name: string; sort_order: number };
type Service = {
  id: string; category_id: string; name: string; slug: string;
  duration_min: number; price_cents: number; description: string | null;
  active: boolean; sort_order: number;
};

export default async function AdminServicesPage() {
  const supabase = createAdminSupabaseClient();

  const [catRes, svcRes] = await Promise.all([
    supabase.from("service_categories").select("id, name, sort_order").order("sort_order"),
    supabase.from("services").select("id, category_id, name, slug, duration_min, price_cents, description, active, sort_order").order("sort_order"),
  ]);

  const categories = (catRes.data ?? []) as Category[];
  const services = (svcRes.data ?? []) as Service[];

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mb-1">Admin</p>
        <h1 className="font-display text-3xl uppercase tracking-wide text-fg">Services</h1>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-fg mt-1">{services.length} services across {categories.length} categories</p>
      </div>
      <ServicesEditor initialCategories={categories} initialServices={services} />
    </div>
  );
}
