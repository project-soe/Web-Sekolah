import type { Metadata } from "next";
import Link from "next/link";
import { FacilityEditor } from "@/features/content/facility-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Tambah Fasilitas" };
export default async function CreateFacilityPage() {
  const session = await requirePermission("facilities:create");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/fasilitas" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke fasilitas</Link><h1 className="mt-3 text-2xl font-bold">Tambah Fasilitas</h1><p className="mt-1 text-sm text-muted-foreground">Data baru tersimpan sebagai draft sampai dipublikasikan petugas berwenang.</p></div>
    <FacilityEditor canPublish={can(session.access,"facilities:publish")} />
  </div>;
}
