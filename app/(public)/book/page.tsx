export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function BookEntryPage() {
  redirect("/book/service");
}
