import type { Metadata } from "next";
import { logout } from "@/features/auth/actions";
import { saveAttendanceDraft, submitAttendance } from "@/features/attendance/actions";
import { requireTeacher } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Absensi Kelas | Ruang Guru" };
export const dynamic = "force-dynamic";

type RosterRow = {
  class_group_id: string;
  class_name: string;
  academic_year: string;
  attendance_date: string;
  session_id: string | null;
  session_status: "draft" | "submitted" | "locked" | null;
  student_id: string;
  nis: string;
  full_name: string;
  attendance_status: "present" | "late" | "sick" | "excused" | "absent" | null;
  attendance_note: string | null;
};

const statusLabels = [
  ["present", "Hadir"],
  ["late", "Terlambat"],
  ["sick", "Sakit"],
  ["excused", "Izin"],
  ["absent", "Alpa"],
] as const;

const messages: Record<string, string> = {
  akses: "Kamu tidak memiliki izin untuk tindakan tersebut.",
  validasi: "Data absensi tidak valid.",
  simpan: "Gagal menyimpan draft absensi.",
  kirim: "Gagal mengirim absensi.",
  belum_lengkap: "Semua siswa harus memiliki status sebelum absensi dikirim.",
};

export default async function TeacherPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requireTeacher();
  const params = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_teacher_attendance_roster", { p_date: today });
  const rows = (data ?? []) as RosterRow[];
  const grouped = new Map<string, RosterRow[]>();
  for (const row of rows) {
    const group = grouped.get(row.class_group_id) ?? [];
    group.push(row);
    grouped.set(row.class_group_id, group);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Portal tenaga pendidik</p>
          <h1 className="text-3xl font-bold">Ruang Guru</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-primary hover:underline">Keluar</button>
        </form>
      </header>

      <section className="space-y-1">
        <h2 className="text-xl font-semibold">Absensi harian</h2>
        <p className="text-sm text-muted-foreground">Tanggal {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date())}. Batas input: hari ini sampai 7 hari kalender ke belakang.</p>
      </section>

      {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{messages[params.error] ?? "Terjadi kesalahan."}</p>}
      {params.saved && <p role="status" className="rounded-lg border border-border bg-muted/40 p-3 text-sm">{params.saved === "terkirim" ? "Absensi berhasil dikirim." : "Draft absensi berhasil disimpan."}</p>}
      {error && <p role="alert" className="rounded-lg border border-danger/30 p-3 text-sm text-danger">Gagal memuat roster absensi. Pastikan migrasi absensi sudah diterapkan.</p>}

      {!error && grouped.size === 0 && (
        <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">
          Belum ada kelas wali yang ditugaskan ke akun ini, atau belum ada siswa aktif pada rombel.
        </div>
      )}

      {[...grouped.entries()].map(([classId, students]) => {
        const first = students[0];
        const status = first.session_status;
        const editable = !status || status === "draft";
        return (
          <section key={classId} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <h3 className="font-semibold">{first.class_name}</h3>
                <p className="text-sm text-muted-foreground">Tahun ajaran {first.academic_year} · {students.length} siswa</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {status === "locked" ? "Terkunci" : status === "submitted" ? "Terkirim" : "Draft"}
              </span>
            </div>
            <form action={saveAttendanceDraft} className="space-y-4 p-4">
              <input type="hidden" name="class_group_id" value={classId} />
              <input type="hidden" name="attendance_date" value={today} />
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div key={student.student_id} className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{index + 1}. {student.full_name}</p>
                      <p className="text-xs text-muted-foreground">NIS {student.nis}</p>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor={`status-${student.student_id}`} className="text-xs text-muted-foreground">Status kehadiran</label>
                      <select
                        id={`status-${student.student_id}`}
                        name={`status:${student.student_id}`}
                        defaultValue={student.attendance_status ?? ""}
                        disabled={!editable}
                        className="min-h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Belum diisi</option>
                        {statusLabels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    {editable && (
                      <input
                        name={`note:${student.student_id}`}
                        defaultValue={student.attendance_note ?? ""}
                        maxLength={500}
                        placeholder="Catatan (opsional)"
                        aria-label={`Catatan ${student.full_name}`}
                        className="min-h-10 rounded-md border border-border bg-background px-3 text-sm sm:col-span-2"
                      />
                    )}
                  </div>
                ))}
              </div>
              {editable ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <button formAction={saveAttendanceDraft} className="min-h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted">Simpan draft</button>
                  <button formAction={submitAttendance} className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" >Kirim absensi</button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Absensi sudah dikirim. Hubungi admin sekolah jika perlu koreksi.</p>
              )}
            </form>
          </section>
        );
      })}
    </main>
  );
}
