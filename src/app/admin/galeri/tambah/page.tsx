import type { Metadata } from "next";
import Link from "next/link";
import { GalleryEditor } from "@/features/content/gallery-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Tambah Album Galeri" };
export const dynamic = "force-dynamic";

export default async function CreateGalleryPage() {
  const session = await requirePermission("galleries:create");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/galeri" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke galeri</Link>
        <h1 className="mt-3 text-2xl font-bold">Tambah Album</h1>
        <p className="mt-1 text-sm text-muted-foreground">Buat album dokumentasi dan tambahkan foto sekolah.</p>
      </div>
      <GalleryEditor canPublish={can(session.access, "galleries:publish")} />
    </div>
  );
}
