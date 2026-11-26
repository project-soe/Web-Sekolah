import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAttendanceSession } from "@/features/attendance/actions";

export const metadata: Metadata = { title: "Absensi Siswa" };
export const dynamic = "force-dynamic";

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

type HomeroomClass = {
  class_group_id: string;
  class_name: string;
  grade_level: number;
  academic_year_id: string;
  academic_year_name: string;
  enrolled_count: number;
  capacity: number;
};

export default async function TeacherAttendancePage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireTeacher();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: classesData, error } = await supabase.rpc("my_homeroom_classes");
  const classes = (classesData ?? null) as HomeroomClass[] | null;
  const errors: Record<string,string> = {
    akses: "Akun tidak memiliki hak akses absensi wali kelas.",
    validasi: "Pilih kelas dan tanggal yang valid.",
    kalender: "Tanggal tersebut bukan hari sekolah pada kalender pendidikan.",
    simpan: "Sesi absensi gagal dibuat.",
  };
  return <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 p-6">
    <header className="flex items-center justify-between gap-3"><div><Link href="/ruang-guru" className="text-sm text-muted-foreground hover:text-primary">← Ruang Guru</Link><h1 className="mt-2 text-2xl font-bold">Absensi Siswa</h1><p className="mt-1 text-sm text-muted-foreground">Pilih rombel dan tanggal sesuai kalender pendidikan.</p></div></header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors[params.error] ?? "Terjadi kesalahan."}</p>}
    {error ? <p role="alert" className="text-sm text-danger">Gagal memuat rombel wali kelas.</p> : !classes?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada rombel yang ditugaskan kepada akun ini sebagai wali kelas. Hubungi admin sekolah jika penugasan belum sesuai.</p> : <div className="grid gap-4 md:grid-cols-2">{classes.map((item) => <section key={item.class_group_id} className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">{item.class_name}</h2><p className="text-sm text-muted-foreground">Tahun ajaran {item.academic_year_name} · {item.enrolled_count}/{item.capacity} siswa</p>
      <form action={createAttendanceSession} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="class_group_id" value={item.class_group_id}/>
        <label className="grid flex-1 gap-1 text-sm"><span className="font-medium">Tanggal absensi</span><input type="date" name="attendance_date" defaultValue={todayJakarta()} required className="h-10 rounded-md border border-input bg-background px-3"/></label>
        <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Buka absensi</button>
      </form>
    </section>)}</div>}
  </main>;
}
