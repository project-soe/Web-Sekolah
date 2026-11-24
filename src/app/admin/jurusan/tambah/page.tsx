import type { Metadata } from "next";
import Link from "next/link";
import { DepartmentEditor } from "@/features/content/department-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Tambah Jurusan" };

export default async function CreateDepartmentPage() {
  const session = await requirePermission("departments:create");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/jurusan" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke jurusan</Link>
      <h1 className="mt-3 text-2xl font-bold">Tambah Jurusan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Data baru disimpan tersembunyi sampai dipublikasikan petugas berwenang.</p></div>
    <DepartmentEditor canPublish={can(session.access, "departments:publish")} />
  </div>;
}
