import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventEditor } from "@/features/content/event-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Agenda" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("events:view");
  if (!can(session.access, "events:update")) redirect("/admin/agenda?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("events")
    .select("id, title, slug, summary, description, location, starts_at, ends_at, image_path, registration_url, status, published_at, sort_order")
    .eq("id", id).maybeSingle();
  if (error || !item) notFound();
  if (item.status === "published" && !can(session.access, "events:publish")) redirect("/admin/agenda?error=publikasi");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/agenda" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke agenda</Link>
      <h1 className="mt-3 text-2xl font-bold">Edit Agenda</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui detail kegiatan dan publikasinya.</p></div>
    <EventEditor initial={item} canPublish={can(session.access, "events:publish")} />
  </div>;
}
