import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AchievementEditor } from "@/features/content/achievement-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Prestasi" };
export const dynamic = "force-dynamic";

export default async function EditAchievementPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("achievements:view");
  if (!can(session.access, "achievements:update")) redirect("/admin/prestasi?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("achievements")
    .select("id, title, slug, description, recipient, achievement_level, achievement_date, image_path, status, published_at, sort_order")
    .eq("id", id).maybeSingle();
  if (error || !item) notFound();
  if (item.status === "published" && !can(session.access, "achievements:publish")) redirect("/admin/prestasi?error=publikasi");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/prestasi" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke prestasi</Link>
      <h1 className="mt-3 text-2xl font-bold">Edit Prestasi</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui informasi dan status publikasi prestasi.</p></div>
    <AchievementEditor initial={item} canPublish={can(session.access, "achievements:publish")} />
  </div>;
}
