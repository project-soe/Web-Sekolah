import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { AchievementEditor } from "@/features/content/achievement-editor";

export const metadata: Metadata = { title: "Tambah Prestasi" };
export const dynamic = "force-dynamic";

export default async function CreateAchievementPage() {
  const session = await requirePermission("achievements:create");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/prestasi" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke prestasi</Link>
      <h1 className="mt-3 text-2xl font-bold">Tambah Prestasi</h1><p className="mt-1 text-sm text-muted-foreground">Simpan sebagai draft atau jadwalkan publikasi.</p></div>
    <AchievementEditor canPublish={can(session.access, "achievements:publish")} />
  </div>;
}
