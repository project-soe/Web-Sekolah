import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TeacherEditor } from "@/features/content/teacher-editor";
import { TeacherAccountInvitationForm } from "@/features/content/teacher-account-invitation-form";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Guru" };
export const dynamic = "force-dynamic";

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("teachers:view");
  if (!can(session.access, "teachers:update")) redirect("/admin/guru?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: item, error }, { data: departments }] = await Promise.all([
    supabase.from("teachers").select("id, full_name, slug, employee_number, position, department_id, education, biography, email, photo_path, sort_order, is_published")
      .eq("id", id).maybeSingle(),
    supabase.from("departments").select("id, name").eq("is_published", true).order("name"),
  ]);
  if (error || !item) notFound();
  if (item.is_published && !can(session.access, "teachers:publish")) redirect("/admin/guru?error=publikasi");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/guru" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke guru</Link>
      <h1 className="mt-3 text-2xl font-bold">Edit Data Guru</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui profil guru dan pengaturan visibilitas.</p></div>
    <TeacherEditor initial={item} departments={departments ?? []} canPublish={can(session.access, "teachers:publish")} />
    {can(session.access, "teacher_accounts:manage") && (
      <TeacherAccountInvitationForm teacherId={item.id} email={item.email} />
    )}
  </div>;
}
