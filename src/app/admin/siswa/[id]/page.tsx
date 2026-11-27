import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { can } from "@/lib/rbac/access";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { changeStudentLifecycle } from "@/features/students/student-actions";
import { StudentPortalInvitationForm } from "@/features/students/student-portal-invitation-form";

export const metadata: Metadata = { title: "Detail Siswa" };
export const dynamic = "force-dynamic";
const labels: Record<string, string> = { active: "Aktif", graduated: "Lulus", transferred: "Pindah", withdrawn: "Keluar" };
function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? value + "T00:00:00+07:00" : value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(date);
}

export default async function StudentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const session = await requirePermission("students:view");
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: student, error }, { data: history }, { data: portalAccount }] = await Promise.all([
    supabase.from("students").select("id, nis, nisn, full_name, email, gender, birth_place, birth_date, address, guardian_name, guardian_phone, enrollment_year, status, graduation_date, notes, departments(name)").eq("id", id).maybeSingle(),
    supabase.from("student_status_history").select("id, old_status, new_status, changed_at").eq("student_id", id).order("changed_at", { ascending: false }).limit(50),
    can(session.access, "students:update")
      ? supabase.from("student_portal_accounts").select("user_id, linked_at").eq("student_id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (error || !student) notFound();
  const department = Array.isArray(student.departments) ? student.departments[0] : student.departments;
  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><Link href="/admin/siswa" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke data siswa</Link><h1 className="mt-3 text-2xl font-bold">{student.full_name}</h1><p className="mt-1 text-sm text-muted-foreground">NIS {student.nis} · {labels[student.status] ?? student.status}</p></div>{can(session.access, "students:update") && <Link href={"/admin/siswa/" + id + "/edit"} className={buttonVariants({ size: "md", variant: "outline" })}>Edit data</Link>}</header>
    {query.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{query.error === "akses" ? "Akun tidak memiliki permission untuk mengubah status siswa." : "Perubahan status siswa gagal diproses."}</p>}
    {query.saved === "lifecycle" ? <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Status siswa berhasil diperbarui. Penempatan kelas aktif ditutup dan riwayat tetap tersimpan.</p> : query.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data siswa berhasil disimpan.</p>}
    <Card><CardContent className="grid gap-5 sm:grid-cols-2">
      <div><p className="text-xs text-muted-foreground">NISN</p><p className="mt-1 font-medium">{student.nisn ?? "—"}</p></div>
      <div><p className="text-xs text-muted-foreground">Email siswa</p><p className="mt-1 font-medium">{student.email ?? "Belum diisi"}</p></div>
      <div><p className="text-xs text-muted-foreground">Jenis kelamin</p><p className="mt-1 font-medium">{student.gender === "male" ? "Laki-laki" : "Perempuan"}</p></div>
      <div><p className="text-xs text-muted-foreground">Tempat, tanggal lahir</p><p className="mt-1 font-medium">{student.birth_place ?? "—"}, {formatDate(student.birth_date)}</p></div>
      <div><p className="text-xs text-muted-foreground">Tahun masuk</p><p className="mt-1 font-medium">{student.enrollment_year}</p></div>
      <div><p className="text-xs text-muted-foreground">Jurusan</p><p className="mt-1 font-medium">{department?.name ?? "Belum ditentukan"}</p></div>
      <div><p className="text-xs text-muted-foreground">Tanggal lulus</p><p className="mt-1 font-medium">{formatDate(student.graduation_date)}</p></div>
      <div><p className="text-xs text-muted-foreground">Orang tua / wali</p><p className="mt-1 font-medium">{student.guardian_name ?? "—"}</p></div>
      <div><p className="text-xs text-muted-foreground">Telepon wali</p><p className="mt-1 font-medium">{student.guardian_phone ?? "—"}</p></div>
      <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Alamat</p><p className="mt-1 whitespace-pre-wrap font-medium">{student.address ?? "—"}</p></div>
      <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Catatan internal</p><p className="mt-1 whitespace-pre-wrap font-medium">{student.notes ?? "—"}</p></div>
    </CardContent></Card>
    {can(session.access, "students:update") && student.status === "active" && <Card><CardContent className="flex flex-col gap-3">
      <div><h2 className="font-semibold">Akun Portal Siswa</h2><p className="text-sm text-muted-foreground">Buat undangan khusus agar siswa dapat membuat akun dan terhubung dengan data induk ini.</p></div>
      {portalAccount ? <p className="text-sm text-success">Siswa ini sudah terhubung ke akun Portal Siswa.</p> : {student.email ? <StudentPortalInvitationForm studentId={student.id} /> : <p className="text-sm text-muted-foreground">Isi email siswa melalui tombol Edit data sebelum membuat undangan Portal Siswa. Email ini akan menjadi satu-satunya email yang dapat mengklaim undangan.</p>}}
    </CardContent></Card>}
    {student.status === "active" && can(session.access, "students:update") && can(session.access, "classes:view") && can(session.access, "classes:update") && <Card><CardContent className="flex flex-col gap-3">
      <div><h2 className="font-semibold">Proses status akademik</h2><p className="text-sm text-muted-foreground">Gunakan hanya jika siswa benar-benar pindah sekolah atau mengundurkan diri. Penempatan pada tahun ajaran aktif akan ditutup, kapasitas kelas dibebaskan, dan riwayat tetap disimpan.</p></div>
      <div className="flex flex-wrap gap-3">
        <form action={changeStudentLifecycle}><input type="hidden" name="student_id" value={student.id}/><input type="hidden" name="new_status" value="transferred"/><button className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Catat siswa pindah</button></form>
        <form action={changeStudentLifecycle}><input type="hidden" name="student_id" value={student.id}/><input type="hidden" name="new_status" value="withdrawn"/><button className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Catat mengundurkan diri</button></form>
      </div>
    </CardContent></Card>}
    <section className="flex flex-col gap-3"><div><h2 className="text-lg font-semibold">Riwayat status</h2><p className="text-sm text-muted-foreground">Riwayat dibuat otomatis oleh database dan tidak diedit melalui formulir.</p></div>
      {!history?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Riwayat status belum tersedia.</p> : <Card><CardContent className="divide-y divide-border p-0">{history.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm"><p className="font-medium">{item.old_status ? labels[item.old_status] + " → " : "Status awal: "}{labels[item.new_status] ?? item.new_status}</p><time className="text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.changed_at))}</time></div>)}</CardContent></Card>}
    </section>
  </div>;
}
