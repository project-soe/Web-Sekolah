import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";
import { activateAcademicYear, assignStudentToClass, createAcademicYear, createClassGroup } from "@/features/students/class-actions";

export const metadata: Metadata = { title: "Tahun Ajaran dan Kelas" };
export const dynamic = "force-dynamic";

export default async function AdminClassesPage({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requirePermission("classes:view");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: years, error: yearsError }, { data: departments }, { data: teachers }, { data: students }] = await Promise.all([
    supabase.from("academic_years").select("id, name, start_date, end_date, is_active").order("start_date", { ascending: false }),
    supabase.from("departments").select("id, name").order("name"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("students").select("id, nis, full_name").eq("status", "active").order("full_name").limit(500),
  ]);
  const activeYear = years?.find((year) => year.is_active) ?? null;
  const { data: classes, error: classesError } = await supabase.from("class_groups")
    .select("id, name, grade_level, academic_year_id, departments(name), teachers(full_name)")
    .order("grade_level").order("name");
  const { data: placements } = await supabase.from("student_class_enrollments")
    .select("id, student_id, class_group_id, academic_year_id, students(full_name, nis), class_groups(name)")
    .eq("academic_year_id", activeYear?.id ?? "00000000-0000-0000-0000-000000000000");
  const errorMessage: Record<string, string> = {
    akses: "Akun tidak memiliki permission yang dibutuhkan.",
    validasi: "Data tidak valid. Periksa kembali isian.",
    duplikat: "Tahun ajaran atau nama kelas tersebut sudah ada.",
    simpan: "Data gagal disimpan. Periksa relasi dan coba lagi.",
    kelas: "Kelas tujuan tidak ditemukan.",
    siswa: "Siswa tidak ditemukan atau statusnya bukan aktif.",
    penempatan: "Penempatan siswa gagal disimpan.",
  };
  return <div className="flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-bold">Tahun Ajaran dan Kelas</h1>
      <p className="mt-1 text-sm text-muted-foreground">Kelola tahun ajaran, rombongan belajar, wali kelas, dan penempatan siswa. Contoh nama kelas: X TKJ 1.</p>
    </header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errorMessage[params.error] ?? "Terjadi kesalahan."}</p>}
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Perubahan berhasil disimpan.</p>}

    <section className="grid gap-5 lg:grid-cols-2">
      <Card><CardContent className="flex flex-col gap-4">
        <div><h2 className="font-semibold">Tahun ajaran</h2><p className="text-sm text-muted-foreground">Hanya satu tahun ajaran dapat aktif pada satu waktu.</p></div>
        {yearsError ? <p role="alert" className="text-sm text-danger">Gagal memuat tahun ajaran.</p> : !years?.length ? <p className="text-sm text-muted-foreground">Belum ada tahun ajaran.</p> : <ul className="divide-y divide-border">{years.map((year) => <li key={year.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{year.name} {year.is_active && <span className="ml-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">Aktif</span>}</p><p className="text-xs text-muted-foreground">{year.start_date} – {year.end_date}</p></div>{!year.is_active && can(session.access, "classes:update") && <form action={activateAcademicYear}><input type="hidden" name="id" value={year.id}/><button className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Jadikan aktif</button></form>}</li>)}</ul>}
        {can(session.access, "classes:create") && <form action={createAcademicYear} className="grid gap-3 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">Tambah tahun ajaran</h3>
          <Field id="year_name" label="Nama tahun ajaran"><Input id="year_name" name="name" placeholder="2026/2027" required pattern="[0-9]{4}/[0-9]{4}"/></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field id="year_start" label="Tanggal mulai"><Input id="year_start" name="start_date" type="date" required/></Field><Field id="year_end" label="Tanggal selesai"><Input id="year_end" name="end_date" type="date" required/></Field></div>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Simpan tahun ajaran</button>
        </form>}
      </CardContent></Card>

      <Card><CardContent className="flex flex-col gap-4">
        <div><h2 className="font-semibold">Tambah rombongan belajar</h2><p className="text-sm text-muted-foreground">Buat kelas pada tahun ajaran tertentu.</p></div>
        {!years?.length ? <p className="text-sm text-muted-foreground">Buat tahun ajaran terlebih dahulu.</p> : can(session.access, "classes:create") && <form action={createClassGroup} className="grid gap-3">
          <Field id="class_year" label="Tahun ajaran"><Select id="class_year" name="academic_year_id" required defaultValue={activeYear?.id ?? ""}><option value="" disabled>Pilih tahun ajaran</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_active ? " (Aktif)" : ""}</option>)}</Select></Field>
          <Field id="class_name" label="Nama kelas"><Input id="class_name" name="name" placeholder="X TKJ 1" required minLength={3} maxLength={80}/></Field>
          <Field id="grade_level" label="Tingkat"><Select id="grade_level" name="grade_level" required defaultValue="10"><option value="10">X</option><option value="11">XI</option><option value="12">XII</option></Select></Field>
          <Field id="class_department" label="Jurusan"><Select id="class_department" name="department_id"><option value="">Tidak ditentukan</option>{(departments ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field id="class_teacher" label="Wali kelas"><Select id="class_teacher" name="homeroom_teacher_id"><option value="">Belum ditentukan</option>{(teachers ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</Select></Field>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Simpan kelas</button>
        </form>}
      </CardContent></Card>
    </section>

    <section className="flex flex-col gap-3">
      <div><h2 className="text-lg font-semibold">Daftar kelas</h2><p className="text-sm text-muted-foreground">Daftar semua kelas berdasarkan tahun ajaran.</p></div>
      {classesError ? <p role="alert" className="text-sm text-danger">Gagal memuat kelas.</p> : !classes?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada rombongan belajar.</p> : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border bg-muted/50"><tr><th className="px-4 py-3">Kelas</th><th className="px-4 py-3">Tingkat</th><th className="px-4 py-3">Jurusan</th><th className="px-4 py-3">Wali kelas</th><th className="px-4 py-3">Tahun ajaran</th></tr></thead><tbody className="divide-y divide-border">{classes.map((item) => {const department = Array.isArray(item.departments) ? item.departments[0] : item.departments; const teacher = Array.isArray(item.teachers) ? item.teachers[0] : item.teachers; const year = years?.find((entry) => entry.id === item.academic_year_id); return <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">{["","", "X","XI","XII"][item.grade_level]}</td><td className="px-4 py-3">{department?.name ?? "—"}</td><td className="px-4 py-3">{teacher?.full_name ?? "—"}</td><td className="px-4 py-3">{year?.name ?? "—"}</td></tr>;})}</tbody></table></CardContent></Card>}
    </section>

    {activeYear && <section className="flex flex-col gap-3">
      <div><h2 className="text-lg font-semibold">Penempatan siswa — {activeYear.name}</h2><p className="text-sm text-muted-foreground">Setiap siswa hanya memiliki satu kelas per tahun ajaran. Perpindahan kelas dicatat otomatis.</p></div>
      {can(session.access, "classes:update") && can(session.access, "students:update") && <Card><CardContent><form action={assignStudentToClass} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field id="placement_student" label="Siswa"><Select id="placement_student" name="student_id" required defaultValue=""><option value="" disabled>Pilih siswa aktif</option>{(students ?? []).map((student) => <option key={student.id} value={student.id}>{student.nis} — {student.full_name}</option>)}</Select></Field>
        <Field id="placement_class" label="Kelas"><Select id="placement_class" name="class_group_id" required defaultValue=""><option value="" disabled>Pilih kelas tahun aktif</option>{(classes ?? []).filter((item) => item.academic_year_id === activeYear.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Tempatkan siswa</button>
      </form></CardContent></Card>}
      {!placements?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada siswa ditempatkan pada tahun ajaran aktif.</p> : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-border bg-muted/50"><tr><th className="px-4 py-3">NIS</th><th className="px-4 py-3">Nama siswa</th><th className="px-4 py-3">Kelas</th></tr></thead><tbody className="divide-y divide-border">{placements.map((item) => {const student = Array.isArray(item.students) ? item.students[0] : item.students; const classGroup = Array.isArray(item.class_groups) ? item.class_groups[0] : item.class_groups; return <tr key={item.id}><td className="px-4 py-3 font-mono">{student?.nis ?? "—"}</td><td className="px-4 py-3 font-medium">{student?.full_name ?? "—"}</td><td className="px-4 py-3">{classGroup?.name ?? "—"}</td></tr>;})}</tbody></table></CardContent></Card>}
    </section>}
    <p className="text-xs text-muted-foreground">Data kelas dan penempatan siswa bersifat privat. Tidak ada daftar siswa publik.</p>
    <p className="text-sm"><Link href="/admin/siswa" className="text-primary hover:underline">Kembali ke data siswa</Link></p>
  </div>;
}
