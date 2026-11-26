import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAttendanceSession, finalizeAttendanceSession, setAttendanceRecord } from "@/features/attendance/actions";

export const metadata: Metadata = { title: "Daftar Absensi Rombel" };
export const dynamic = "force-dynamic";

type AttendanceRecord = {
  id: string; student_id: string; student_name: string; nis: string;
  status: string | null; arrival_time: string | null; notes: string | null;
};
type AttendanceSession = {
  id: string; attendance_date: string; status: "draft" | "finalized";
  class_group_id: string; class_name: string; academic_year_name: string;
  finalized_at: string | null; records: AttendanceRecord[];
};
const statusLabels: Record<string,string> = {
  present: "Hadir", late: "Terlambat", sick: "Sakit", permitted: "Izin", absent: "Alpa",
};
const statuses = ["present","late","sick","permitted","absent"];
type HomeroomClass = {
  class_group_id: string;
  class_name: string;
  grade_level: number;
  academic_year_id: string;
  academic_year_name: string;
  enrolled_count: number;
  capacity: number;
};

export default async function TeacherAttendanceDetailPage({ params, searchParams }: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string; error?: string; saved?: string; finalized?: string }>;
}) {
  await requireTeacher();
  const { classId } = await params;
  const query = await searchParams;
  const date = query.date ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  if (!/^[0-9a-f-]{36}$/i.test(classId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const supabase = await createClient();
  const { data: classesData } = await supabase.rpc("my_homeroom_classes");
  const classes = (classesData ?? null) as HomeroomClass[] | null;
  const classInfo = classes?.find((item) => item.class_group_id === classId);
  if (!classInfo) notFound();
  const { data, error } = await supabase.rpc("get_attendance_session", {
    p_class_group_id: classId, p_attendance_date: date,
  });
  const session = !error && data ? data as unknown as AttendanceSession : null;
  const completed = session?.records.filter((item) => item.status !== null).length ?? 0;
  const total = session?.records.length ?? 0;
  const errors: Record<string,string> = {
    belum_lengkap: "Masih ada siswa yang belum diberi status. Absensi belum dapat difinalisasi.",
    terkunci: "Sesi sudah difinalisasi dan tidak dapat diubah oleh wali kelas.",
    simpan: "Perubahan absensi gagal disimpan.",
  };
  return <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-6">
    <header><Link href="/ruang-guru/absensi" className="text-sm text-muted-foreground hover:text-primary">← Daftar rombel</Link><div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{classInfo.class_name}</h1><p className="text-sm text-muted-foreground">{classInfo.academic_year_name} · {date}</p></div>{session && <span className="rounded-full border border-border px-3 py-1 text-xs">{session.status === "finalized" ? "Final" : "Draft"}</span>}</div></header>
    {query.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors[query.error] ?? "Terjadi kesalahan."}</p>}
    {query.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Status kehadiran berhasil disimpan.</p>}
    {query.finalized && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Absensi berhasil difinalisasi.</p>}
    {!session ? <section className="rounded-xl border border-border p-4"><h2 className="font-semibold">Sesi absensi belum dibuat</h2><p className="mt-1 text-sm text-muted-foreground">Sesi hanya dapat dibuat pada tanggal yang ditandai sebagai hari sekolah di kalender pendidikan.</p><form action={createAttendanceSession} className="mt-4"><input type="hidden" name="class_group_id" value={classId}/><input type="hidden" name="attendance_date" value={date}/><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Buat sesi absensi</button></form></section>
      : <>
        <div className="text-sm text-muted-foreground">{completed} dari {total} siswa sudah diberi status. Siswa yang belum diisi tetap berstatus “Belum diisi”, bukan otomatis Alpa.</div>
        <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/50"><tr><th className="px-3 py-3">Siswa</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Jam datang</th><th className="px-3 py-3">Catatan</th><th className="px-3 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-border">{session.records.map((record) => <tr key={record.id}><td className="px-3 py-3"><p className="font-medium">{record.student_name}</p><p className="text-xs text-muted-foreground">{record.nis}</p></td><td className="px-3 py-3">{session.status === "finalized" ? (record.status ? statusLabels[record.status] : "Belum diisi") : <form id={"attendance-"+record.id} action={setAttendanceRecord}><input type="hidden" name="record_id" value={record.id}/><input type="hidden" name="class_group_id" value={classId}/><input type="hidden" name="attendance_date" value={date}/><select name="status" required defaultValue={record.status ?? ""} className="h-9 rounded-md border border-input bg-background px-2"><option value="" disabled>Pilih status</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></form>}</td><td className="px-3 py-3">{session.status === "finalized" ? (record.arrival_time ?? "—") : <input form={"attendance-"+record.id} name="arrival_time" type="time" defaultValue={record.arrival_time ?? ""} className="h-9 rounded-md border border-input bg-background px-2"/>}</td><td className="px-3 py-3">{session.status === "finalized" ? (record.notes ?? "—") : <input form={"attendance-"+record.id} name="notes" defaultValue={record.notes ?? ""} maxLength={1000} placeholder="Opsional" className="h-9 w-44 rounded-md border border-input bg-background px-2"/>}</td><td className="px-3 py-3">{session.status === "draft" && <button form={"attendance-"+record.id} className="rounded-md border border-border px-3 py-2 text-xs font-medium">Simpan</button>}</td></tr>)}</tbody></table></div>
        {session.status === "draft" && <form action={finalizeAttendanceSession} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><input type="hidden" name="session_id" value={session.id}/><input type="hidden" name="class_group_id" value={classId}/><input type="hidden" name="attendance_date" value={date}/><div><p className="font-semibold">Finalisasi absensi</p><p className="text-xs text-muted-foreground">Setelah final, perubahan hanya dapat dilakukan admin melalui koreksi beralasan.</p></div><button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Finalisasi ({completed}/{total})</button></form>}
      </>}
  </main>;
}
