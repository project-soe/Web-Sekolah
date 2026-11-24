import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnnouncementEditor } from "@/features/content/announcement-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Pengumuman" };
export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("announcements:view");
  if (!can(session.access, "announcements:update")) redirect("/admin/pengumuman?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("announcements")
    .select("id, title, slug, summary, content, attachment_path, status, published_at, expires_at")
    .eq("id", id).maybeSingle();
  if (error || !item) notFound();
  if (item.status === "published" && !can(session.access, "announcements:publish")) {
    redirect("/admin/pengumuman?error=publikasi");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pengumuman" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke pengumuman</Link>
        <h1 className="mt-3 text-2xl font-bold">Edit Pengumuman</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui isi, status, dan masa berlaku pengumuman.</p>
      </div>
      <AnnouncementEditor initial={item} canPublish={can(session.access, "announcements:publish")} />
    </div>
  );
}
