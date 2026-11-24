import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FacilityEditor } from "@/features/content/facility-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Fasilitas" };
export const dynamic = "force-dynamic";
export default async function EditFacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("facilities:view");
  if (!can(session.access,"facilities:update")) redirect("/admin/fasilitas?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("facilities")
    .select("id, name, slug, facility_type, description, location, capacity, image_path, sort_order, is_published")
    .eq("id",id).maybeSingle();
  if (error || !item) notFound();
  if (item.is_published && !can(session.access,"facilities:publish")) redirect("/admin/fasilitas?error=publikasi");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/fasilitas" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke fasilitas</Link><h1 className="mt-3 text-2xl font-bold">Edit Fasilitas</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui informasi dan visibilitas fasilitas.</p></div>
    <FacilityEditor initial={item} canPublish={can(session.access,"facilities:publish")} />
  </div>;
}
