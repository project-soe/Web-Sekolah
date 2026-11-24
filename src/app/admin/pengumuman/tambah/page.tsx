import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementEditor } from "@/features/content/announcement-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Tambah Pengumuman" };
export const dynamic = "force-dynamic";

export default async function CreateAnnouncementPage() {
  const session = await requirePermission("announcements:create");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pengumuman" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke pengumuman</Link>
        <h1 className="mt-3 text-2xl font-bold">Tambah Pengumuman</h1>
        <p className="mt-1 text-sm text-muted-foreground">Simpan sebagai draft, terbitkan, atau jadwalkan masa berlaku.</p>
      </div>
      <AnnouncementEditor canPublish={can(session.access, "announcements:publish")} />
    </div>
  );
}
