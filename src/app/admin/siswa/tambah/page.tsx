import type { Metadata } from "next";
import Link from "next/link";
import { StudentEditor } from "@/features/students/student-editor";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tambah Siswa" };
export const dynamic = "force-dynamic";

export default async function CreateStudentPage() {
  await requirePermission("students:create");
  const supabase = await createClient();
  const { data: departments } = await supabase.from("departments").select("id, name").order("name");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/siswa" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke data siswa</Link><h1 className="mt-3 text-2xl font-bold">Tambah Siswa</h1><p className="mt-1 text-sm text-muted-foreground">Data induk siswa hanya tersedia bagi petugas berwenang.</p></div>
    <StudentEditor departments={departments ?? []} />
  </div>;
}
