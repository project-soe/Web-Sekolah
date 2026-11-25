import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/rbac/access";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Field, Input, Select } from "@/components/ui/field";
import { updateClassGroup } from "@/features/students/class-actions";

export const metadata: Metadata = { title: "Detail Rombongan Belajar" };
export const dynamic = "force-dynamic";

const gradeLabels: Record<number, string> = { 10: "X", 11: "XI", 12: "XII" };
const statusLabels: Record<string, string> = {
  active: "Aktif",
  graduated: "Lulus",
  transferred: "Pindah",
  withdrawn: "Keluar",
};

export default async function ClassGroupDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requirePermission("classes:view");
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: classGroup, error } = await supabase
    .from("class_groups")
    .select("id, name, grade_level, academic_year_id, department_id, homeroom_teacher_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !classGroup) notFound();

  const [{ data: year }, { data: department }, { data: teacher }, { data: departments }, { data: teachers }] = await Promise.all([
    supabase.from("academic_years").select("name, start_date, end_date, is_active")
      .eq("id", classGroup.academic_year_id).maybeSingle(),
    classGroup.department_id
      ? supabase.from("departments").select("name").eq("id", classGroup.department_id).maybeSingle()
      : Promise.resolve({ data: null }),
    classGroup.homeroom_teacher_id
      ? supabase.from("teachers").select("full_name").eq("id", classGroup.homeroom_teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
  ]);

  const canViewStudents = can(session.access, "students:view");
  const { data: placements, error: placementsError } = canViewStudents
    ? await supabase.from("student_class_enrollments")
        .select("id, student_id, assigned_at")
        .eq("class_group_id", classGroup.id)
        .order("assigned_at", { ascending: true })
    : { data: null, error: null };

  const studentIds = (placements ?? []).map((item) => item.student_id);
  const { data: students, error: studentsError } = canViewStudents && studentIds.length
    ? await supabase.from("students").select("id, nis, full_name, status")
        .in("id", studentIds).order("full_name", { ascending: true })
    : { data: [], error: null };
  const studentsById = new Map((students ?? []).map((student) => [student.id, student]));

  return <div className="flex flex-col gap-6">
    <header>
      <Link href="/admin/kelas" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke daftar kelas</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{classGroup.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Detail rombongan belajar dan daftar siswa</p>
        </div>
        {year?.is_active && <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Tahun ajaran aktif</span>}
      </div>
    </header>


    {query.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{query.error === "duplikat" ? "Nama kelas sudah digunakan pada tahun ajaran ini." : query.error === "validasi" ? "Data tidak valid. Periksa kembali isian." : "Perubahan kelas gagal disimpan."}</p>}
    {query.saved === "kelas" && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data kelas berhasil diperbarui.</p>}
    {can(session.access, "classes:update") && <Card><CardContent className="flex flex-col gap-4">
      <h2 className="font-semibold">Edit data kelas</h2>
      <form action={updateClassGroup} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={classGroup.id}/>
        <input type="hidden" name="academic_year_id" value={classGroup.academic_year_id}/>
        <Field id="edit_class_name" label="Nama kelas"><Input id="edit_class_name" name="name" defaultValue={classGroup.name} minLength={3} maxLength={80} required/></Field>
        <Field id="edit_grade_level" label="Tingkat"><Select id="edit_grade_level" name="grade_level" defaultValue={String(classGroup.grade_level)} required><option value="10">X</option><option value="11">XI</option><option value="12">XII</option></Select></Field>
        <Field id="edit_department" label="Jurusan"><Select id="edit_department" name="department_id" defaultValue={classGroup.department_id ?? ""}><option value="">Tidak ditentukan</option>{(departments ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field id="edit_teacher" label="Wali kelas"><Select id="edit_teacher" name="homeroom_teacher_id" defaultValue={classGroup.homeroom_teacher_id ?? ""}><option value="">Belum ditentukan</option>{(teachers ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</Select></Field>
        <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:col-span-2">Simpan perubahan</button>
      </form>
    </CardContent></Card>}
\n    <Card><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div><p className="text-xs text-muted-foreground">Tingkat</p><p className="mt-1 font-semibold">{gradeLabels[classGroup.grade_level] ?? classGroup.grade_level}</p></div>
      <div><p className="text-xs text-muted-foreground">Jurusan</p><p className="mt-1 font-semibold">{department?.name ?? "Belum ditentukan"}</p></div>
      <div><p className="text-xs text-muted-foreground">Wali kelas</p><p className="mt-1 font-semibold">{teacher?.full_name ?? "Belum ditentukan"}</p></div>
      <div><p className="text-xs text-muted-foreground">Tahun ajaran</p><p className="mt-1 font-semibold">{year?.name ?? "Tidak tersedia"}</p></div>
      <div><p className="text-xs text-muted-foreground">Periode</p><p className="mt-1 font-semibold">{year ? year.start_date + " – " + year.end_date : "—"}</p></div>
      {canViewStudents && <div><p className="text-xs text-muted-foreground">Jumlah siswa</p><p className="mt-1 font-semibold">{placementsError || studentsError ? "Tidak tersedia" : students?.length ?? 0}</p></div>}
    </CardContent></Card>

    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Daftar siswa</h2>
        <p className="text-sm text-muted-foreground">Penempatan siswa untuk rombongan belajar ini pada tahun ajaran terkait.</p>
      </div>
      {!canViewStudents
        ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Akun memerlukan permission data siswa untuk melihat daftar anggota kelas.</p>
        : placementsError || studentsError
          ? <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">Daftar siswa gagal dimuat. Periksa permission dan koneksi database.</p>
          : !students?.length
            ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada siswa yang ditempatkan pada kelas ini.</p>
            : <Card><CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50"><tr>
                  <th className="px-4 py-3">No.</th><th className="px-4 py-3">NIS</th><th className="px-4 py-3">Nama siswa</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Detail</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {students.map((student, index) => <tr key={student.id}>
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 font-mono">{student.nis}</td>
                    <td className="px-4 py-3 font-medium">{student.full_name}</td>
                    <td className="px-4 py-3">{statusLabels[student.status] ?? student.status}</td>
                    <td className="px-4 py-3"><Link href={"/admin/siswa/" + student.id} className="text-primary hover:underline">Lihat siswa</Link></td>
                  </tr>)}
                </tbody>
              </table>
            </CardContent></Card>}
    </section>
    <p className="text-xs text-muted-foreground">Informasi rombongan belajar dan daftar siswa hanya tersedia bagi akun yang memiliki permission sesuai.</p>
  </div>;
}
