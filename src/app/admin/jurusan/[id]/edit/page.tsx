import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DepartmentEditor } from "@/features/content/department-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Jurusan" };
export const dynamic = "force-dynamic";

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("departments:view");
  if (!can(session.access, "departments:update")) redirect("/admin/jurusan?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("departments")
    .select("id, name, slug, description, image_path, sort_order, is_published")
    .eq("id", id).maybeSingle();
  if (error || !item) notFound();
  if (item.is_published && !can(session.access, "departments:publish")) {
    redirect("/admin/jurusan?error=publikasi");
  }
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/jurusan" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke jurusan</Link>
      <h1 className="mt-3 text-2xl font-bold">Edit Data Jurusan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Perbarui informasi program keahlian dan pengaturan visibilitas.</p></div>
    <DepartmentEditor initial={item} canPublish={can(session.access, "departments:publish")} />
  </div>;
}
