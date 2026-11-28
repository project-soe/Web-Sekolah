import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { correctAttendance, setAttendanceLock } from "@/features/attendance/admin-actions";

export const metadata: Metadata = { title: "Rekap Absensi | Admin" };
export const dynamic = "force-dynamic";

type MonthlyRow = {
  class_group_id: string; class_name: string; academic_year: string;
  session_count: number; student_day_count: number; present_count: number; late_count: number;
  sick_count: number; excused_count: number; absent_count: number; attendance_percentage: number;
};
type Row = {
  class_group_id: string; class_name: string; academic_year: string; attendance_date: string;
  session_id: string | null; entry_id: string | null; session_status: "draft" | "submitted" | "locked" | null;
  student_id: string; nis: string; full_name: string;
  attendance_status: "present" | "late" | "sick" | "excused" | "absent" | null;
  attendance_note: string | null;
};
const labels: Record<string, string> = { present: "Hadir", late: "Terlambat", sick: "Sakit", excused: "Izin", absent: "Alpa" };
const errors: Record<string, string> = {
  akses: "Tidak memiliki izin untuk tindakan ini.", validasi: "Data koreksi tidak valid.",
  koreksi: "Koreksi gagal. Pastikan sesi tidak terkunci.", kunci: "Status penguncian gagal.",
};

export default async function AdminAttendancePage({
  searchParams,
}: { searchParams: Promise<{ date?: string; month?: string; error?: string; saved?: string }> }) {
  await requirePermission("attendance:view_all");
  const params = await searchParams;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const month = params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? `${params.month}-01` : `${today.slice(0, 7)}-01`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_teacher_attendance_roster", { p_date: date });
  const rows = (data ?? []) as Row[];
  const { data: monthlyData, error: monthlyError } = await supabase.rpc("admin_attendance_monthly_summary", { p_month: month });
  const monthlyRows = (monthlyData ?? []) as MonthlyRow[];
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const list = groups.get(row.class_group_id) ?? [];
    list.push(row);
    groups.set(row.class_group_id, list);
  }
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <p className="text-sm text-muted-foreground">Administrasi akademik</p>
        <h1 className="text-2xl font-bold">Rekap dan koreksi absensi</h1>
        <p className="text-sm text-muted-foreground">Rekap harian berdasarkan sesi yang sudah dibuat. Draft tidak dihitung sebagai data final.</p>
      </header>
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h2 className="font-semibold">Rekap bulanan per rombel</h2>
          <p className="text-sm text-muted-foreground">Hanya sesi terkirim dan terkunci yang dihitung. Persentase hadir = (Hadir + Terlambat) ÷ seluruh status tercatat.</p>
        </div>
        <form className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">Bulan
            <input type="month" name="month" defaultValue={month.slice(0, 7)} className="min-h-10 rounded-md border border-border bg-background px-3" />
          </label>
          <button className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Tampilkan rekap</button>
        </form>
        {monthlyError && <p role="alert" className="text-sm text-danger">Gagal memuat rekap bulanan. Pastikan migrasi rekap absensi sudah diterapkan.</p>}
        {!monthlyError && monthlyRows.length === 0 && <p className="text-sm text-muted-foreground">Belum ada sesi absensi final pada bulan ini.</p>}
        {!monthlyError && monthlyRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Rombel</th><th className="p-2 text-right">Sesi</th>
                  <th className="p-2 text-right">Hadir</th><th className="p-2 text-right">Terlambat</th>
                  <th className="p-2 text-right">Sakit</th><th className="p-2 text-right">Izin</th>
                  <th className="p-2 text-right">Alpa</th><th className="p-2 text-right">Persentase hadir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyRows.map((item) => (
                  <tr key={item.class_group_id}>
                    <td className="p-2"><span className="font-medium">{item.class_name}</span><span className="block text-xs text-muted-foreground">{item.academic_year} · {item.student_day_count} catatan siswa</span></td>
                    <td className="p-2 text-right tabular-nums">{item.session_count}</td>
                    <td className="p-2 text-right tabular-nums">{item.present_count}</td>
                    <td className="p-2 text-right tabular-nums">{item.late_count}</td>
                    <td className="p-2 text-right tabular-nums">{item.sick_count}</td>
                    <td className="p-2 text-right tabular-nums">{item.excused_count}</td>
                    <td className="p-2 text-right tabular-nums">{item.absent_count}</td>
                    <td className="p-2 text-right font-semibold tabular-nums">{Number(item.attendance_percentage).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <form className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">Tanggal
          <input type="date" name="date" defaultValue={date} className="min-h-10 rounded-md border border-border bg-background px-3" />
        </label>
        <button className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Tampilkan</button>
      </form>
      {params.error && <p role="alert" className="rounded-md border border-danger/30 p-3 text-sm text-danger">{errors[params.error] ?? "Terjadi kesalahan."}</p>}
      {params.saved && <p role="status" className="rounded-md border border-border bg-muted/40 p-3 text-sm">Perubahan absensi berhasil: {params.saved}.</p>}
      {error && <p role="alert" className="rounded-md border border-danger/30 p-3 text-sm text-danger">Gagal memuat data. Pastikan migrasi absensi sudah diterapkan.</p>}
      {!error && groups.size === 0 && <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">Belum ada siswa aktif atau sesi absensi untuk tanggal ini.</p>}
      {[...groups.entries()].map(([id, items]) => {
        const first = items[0];
        const counts = Object.fromEntries(["present", "late", "sick", "excused", "absent"].map((key) => [key, items.filter((item) => item.attendance_status === key).length]));
        const finalSession = first.session_status === "submitted" || first.session_status === "locked";
        return (
          <section key={id} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
              <div><h2 className="font-semibold">{first.class_name}</h2><p className="text-sm text-muted-foreground">Tahun ajaran {first.academic_year} · {items.length} siswa</p></div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{first.session_status === "locked" ? "Terkunci" : first.session_status === "submitted" ? "Terkirim" : first.session_status === "draft" ? "Draft" : "Belum diisi"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-5">
              {Object.entries(labels).map(([key, label]) => <div key={key} className="rounded-md bg-muted/50 p-2"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold tabular-nums">{counts[key]}</p></div>)}
            </div>
            {first.session_id && first.session_status === "submitted" && (
              <form action={setAttendanceLock} className="flex flex-wrap items-end gap-2 border-b border-border p-4">
                <input type="hidden" name="session_id" value={first.session_id} />
                <input type="hidden" name="locked" value="true" />
                <p className="mr-auto text-sm text-muted-foreground">Kunci sesi agar tidak dapat dikoreksi lagi.</p>
                <button className="min-h-9 rounded-md border border-border px-3 text-sm">Kunci sesi</button>
              </form>
            )}
            {first.session_id && first.session_status === "locked" && (
              <form action={setAttendanceLock} className="grid gap-2 border-b border-border p-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <input type="hidden" name="session_id" value={first.session_id} />
                <input type="hidden" name="locked" value="false" />
                <label className="grid gap-1 text-xs text-muted-foreground">Alasan membuka kunci (wajib)
                  <input name="reason" minLength={5} maxLength={500} required className="min-h-9 rounded-md border border-border bg-background px-3 text-sm" />
                </label>
                <button className="min-h-9 rounded-md border border-border px-3 text-sm">Buka kunci</button>
              </form>
            )}
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.student_id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-start">
                  <div><p className="text-sm font-medium">{item.full_name}</p><p className="text-xs text-muted-foreground">NIS {item.nis}</p><p className="mt-1 text-xs">{item.attendance_status ? labels[item.attendance_status] : "Belum diisi"}</p></div>
                  {finalSession && item.entry_id && first.session_status !== "locked" && (
                    <form action={correctAttendance} className="grid gap-2 sm:grid-cols-2">
                      <input type="hidden" name="entry_id" value={item.entry_id} />
                      <select name="status" defaultValue={item.attendance_status ?? "present"} className="min-h-9 rounded-md border border-border bg-background px-2 text-sm">
                        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <input name="note" defaultValue={item.attendance_note ?? ""} maxLength={500} placeholder="Catatan" className="min-h-9 rounded-md border border-border bg-background px-2 text-sm" />
                      <input name="reason" required minLength={5} maxLength={500} placeholder="Alasan koreksi (wajib)" className="min-h-9 rounded-md border border-border bg-background px-2 text-sm sm:col-span-2" />
                      <button className="min-h-9 justify-self-start rounded-md border border-border px-3 text-sm sm:col-span-2">Simpan koreksi</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
