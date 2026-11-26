import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveAcademicCalendarDay, deleteAcademicCalendarDay } from "@/features/attendance/actions";

export const metadata: Metadata = { title: "Kalender Pendidikan" };
export const dynamic = "force-dynamic";

const dayLabels: Record<string, string> = {
  school_day: "Hari sekolah",
  holiday: "Libur",
  special_school_day: "Hari sekolah khusus/pengganti",
  special_holiday: "Libur khusus",
};

export default async function AcademicCalendarPage({ searchParams }: {
  searchParams: Promise<{ year?: string; error?: string; saved?: string }>;
}) {
  await requirePermission("attendance:calendar_manage");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: years } = await supabase.from("academic_years")
    .select("id,name,start_date,end_date,is_active").order("start_date", { ascending: false });
  const selectedYear = years?.find((item) => item.id === params.year) ?? years?.find((item) => item.is_active) ?? years?.[0] ?? null;
  const { data: days, error } = selectedYear
    ? await supabase.from("academic_calendar_days")
        .select("id,calendar_date,day_type,title,notes")
        .eq("academic_year_id", selectedYear.id)
        .order("calendar_date", { ascending: true })
    : { data: [], error: null };

  const errors: Record<string, string> = {
    akses: "Akun tidak memiliki izin mengelola kalender pendidikan.",
    validasi: "Data tanggal atau jenis hari tidak valid.",
    rentang: "Tanggal harus berada dalam rentang tahun ajaran yang dipilih.",
    terpakai: "Tanggal sudah digunakan oleh sesi absensi dan tidak dapat dihapus/diubah menjadi libur.",
    simpan: "Perubahan kalender gagal disimpan.",
  };

  return <div className="flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-bold">Kalender Pendidikan</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tentukan hari sekolah, libur, dan hari sekolah khusus/pengganti. Absensi hanya dapat dibuat pada tanggal yang ditandai sebagai hari sekolah.</p>
    </header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors[params.error] ?? "Terjadi kesalahan."}</p>}
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Kalender pendidikan berhasil diperbarui.</p>}
    {!years?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Buat tahun ajaran terlebih dahulu pada menu Kelas.</p> : <>
      <form className="flex flex-wrap items-end gap-3" action="/admin/kalender-pendidikan">
        <label className="grid gap-1 text-sm"><span className="font-medium">Tahun ajaran</span>
          <select name="year" defaultValue={selectedYear?.id} className="h-10 min-w-56 rounded-md border border-input bg-background px-3">
            {(years ?? []).map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_active ? " (Aktif)" : ""}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-md border border-border px-4 text-sm">Tampilkan</button>
      </form>
      {selectedYear && <section className="rounded-xl border border-border p-4">
        <h2 className="font-semibold">Tambah / ubah hari kalender — {selectedYear.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{selectedYear.start_date} sampai {selectedYear.end_date}</p>
        <form action={saveAcademicCalendarDay} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="academic_year_id" value={selectedYear.id}/>
          <label className="grid gap-1 text-sm"><span className="font-medium">Tanggal</span><input type="date" name="calendar_date" min={selectedYear.start_date} max={selectedYear.end_date} required className="h-10 rounded-md border border-input bg-background px-3"/></label>
          <label className="grid gap-1 text-sm"><span className="font-medium">Jenis hari</span><select name="day_type" required defaultValue="school_day" className="h-10 rounded-md border border-input bg-background px-3">{Object.entries(dayLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-sm sm:col-span-2"><span className="font-medium">Nama / keterangan singkat</span><input name="title" maxLength={120} placeholder="Contoh: Pengganti libur Idulfitri" className="h-10 rounded-md border border-input bg-background px-3"/></label>
          <label className="grid gap-1 text-sm sm:col-span-2"><span className="font-medium">Catatan</span><textarea name="notes" rows={2} maxLength={1000} className="rounded-md border border-input bg-background p-3"/></label>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Simpan tanggal</button>
        </form>
      </section>}
      <section className="flex flex-col gap-3">
        <div><h2 className="text-lg font-semibold">Daftar kalender</h2><p className="text-sm text-muted-foreground">{days?.length ?? 0} tanggal tercatat.</p></div>
        {error ? <p role="alert" className="text-sm text-danger">Gagal memuat kalender.</p> : !days?.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada tanggal kalender. Tambahkan tanggal sekolah dan libur sesuai kalender pendidikan.</p> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/50"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Jenis hari</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-border">{days.map((day) => <tr key={day.id}><td className="px-4 py-3 font-mono">{day.calendar_date}</td><td className="px-4 py-3">{dayLabels[day.day_type] ?? day.day_type}</td><td className="px-4 py-3">{day.title || day.notes || "—"}</td><td className="px-4 py-3"><form action={deleteAcademicCalendarDay}><input type="hidden" name="calendar_day_id" value={day.id}/><button className="text-sm text-danger hover:underline">Hapus</button></form></td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}
