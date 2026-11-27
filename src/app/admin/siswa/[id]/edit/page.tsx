import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudentEditor } from "@/features/students/student-editor";
import { can } from "@/lib/rbac/access";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Data Siswa" };
export const dynamic = "force-dynamic";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("students:view");
  if (!can(session.access, "students:update")) redirect("/admin/siswa?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: student, error }, { data: departments }] = await Promise.all([
    supabase.from("students").select("id, nis, nisn, full_name, email, gender, birth_place, birth_date, address, guardian_name, guardian_phone, department_id, enrollment_year, status, graduation_date, notes").eq("id", id).maybeSingle(),
    supabase.from("departments").select("id, name").order("name"),
  ]);
  if (error || !student) notFound();
  return <div className="flex flex-col gap-6">
    <div><Link href={"/admin/siswa/" + id} className="text-sm text-muted-foreground hover:text-primary">← Kembali ke detail siswa</Link><h1 className="mt-3 text-2xl font-bold">Edit Data Siswa</h1><p className="mt-1 text-sm text-muted-foreground">Status dan tanggal kelulusan hanya dapat diubah melalui proses akademik khusus.</p></div>
    <StudentEditor initial={student} departments={departments ?? []} />
  </div>;
}
