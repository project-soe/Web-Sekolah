import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GalleryEditor } from "@/features/content/gallery-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Album Galeri" };
export const dynamic = "force-dynamic";

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("galleries:view");
  if (!can(session.access, "galleries:update")) redirect("/admin/galeri?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("galleries")
    .select("id, title, slug, description, status, published_at, sort_order, cover_path, gallery_images(id, image_path, alt_text, caption)")
    .eq("id", id).maybeSingle();
  if (error || !item) notFound();
  if (item.status === "published" && !can(session.access, "galleries:publish")) {
    redirect("/admin/galeri?error=publikasi");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/galeri" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke galeri</Link>
        <h1 className="mt-3 text-2xl font-bold">Edit Album</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui informasi, foto, dan status publikasi album.</p>
      </div>
      <GalleryEditor initial={item} canPublish={can(session.access, "galleries:publish")} />
    </div>
  );
}
