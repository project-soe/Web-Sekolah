import type { Metadata } from "next";
import { can } from "@/lib/rbac/access";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { correctAttendanceRecord } from "@/features/attendance/actions";

export const metadata: Metadata = { title: "Laporan Absensi" };
export const dynamic = "force-dynamic";

type AttendanceRecord = {
  id: string; student_name: string; nis: string; status: string | null;
  arrival_time: string | null; notes: string | null;
};
type AttendanceSession = {
  id: string; attendance_date: string; status: string; class_name: string;
  academic_year_name: string; records: AttendanceRecord[];
};
const statusLabels: Record<string,string> = {
  present: "Hadir", late: "Terlambat", sick: "Sakit", permitted: "Izin", absent: "Alpa",
};
const statuses = ["present","late","sick","permitted","absent"];

export default async function AttendanceReportPage({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await requirePermission("attendance:reports");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: sessions, error } = await supabase.from("attendance_sessions")
    .select("id,class_group_id,attendance_date,status")
    .order("attendance_date", { ascending: false }).limit(50);
  const detailed = await Promise.all((sessions ?? []).map(async (item) => {
    const { data } = await supabase.rpc("get_attendance_session", {
      p_class_group_id: item.class_group_id,
      p_attendance_date: item.attendance_date,
    });
    return data as unknown as AttendanceSession | null;
  }));
  const canCorrect = can(session.access, "attendance:correct");
  return <div className="flex flex-col gap-6">
    <header><h1 className="text-2xl font-bold">Laporan Absensi</h1><p className="mt-1 text-sm text-muted-foreground">Pantau sesi absensi dan lakukan koreksi setelah finalisasi dengan alasan yang tercatat pada audit trail.</p></header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{params.error === "validasi" ? "Data koreksi tidak valid." : params.error === "akses" ? "Akun tidak memiliki izin koreksi." : "Koreksi absensi gagal disimpan."}</p>}
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Koreksi berhasil disimpan dan dicatat pada audit trail.</p>}
    {error ? <p role="alert" className="text-sm text-danger">Gagal memuat laporan absensi.</p> : !detailed.length ? <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Belum ada sesi absensi.</p> : <div className="grid gap-4">{detailed.filter((item): item is AttendanceSession => Boolean(item)).map((item) => <section key={item.id} className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{item.class_name}</h2><p className="text-sm text-muted-foreground">{item.academic_year_name} · {item.attendance_date}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs">{item.status === "finalized" ? "Final" : "Draft"}</span></div>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-muted/50"><tr><th className="px-3 py-2">Siswa</th><th className="px-3 py-2">Status sekarang</th><th className="px-3 py-2">Koreksi</th></tr></thead><tbody className="divide-y divide-border">{item.records.map((record) => <tr key={record.id}><td className="px-3 py-3"><p className="font-medium">{record.student_name}</p><p className="text-xs text-muted-foreground">{record.nis}</p></td><td className="px-3 py-3">{record.status ? statusLabels[record.status] : "Belum diisi"}{record.arrival_time ? " · " + record.arrival_time : ""}{record.notes ? <p className="text-xs text-muted-foreground">{record.notes}</p> : null}</td><td className="px-3 py-3">{canCorrect && item.status === "finalized" ? <form action={correctAttendanceRecord} className="grid min-w-[330px] gap-2">
          <input type="hidden" name="record_id" value={record.id}/>
          <div className="grid grid-cols-2 gap-2"><select name="status" defaultValue={record.status ?? "absent"} className="h-9 rounded-md border border-input bg-background px-2">{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><input name="arrival_time" type="time" defaultValue={record.arrival_time ?? ""} className="h-9 rounded-md border border-input bg-background px-2"/></div>
          <input name="notes" defaultValue={record.notes ?? ""} maxLength={1000} placeholder="Catatan" className="h-9 rounded-md border border-input bg-background px-2"/>
          <input name="reason" required minLength={5} maxLength={500} placeholder="Alasan koreksi (wajib)" className="h-9 rounded-md border border-input bg-background px-2"/>
          <button className="w-fit rounded-md border border-border px-3 py-2 text-xs font-medium">Simpan koreksi</button>
        </form> : <span className="text-xs text-muted-foreground">{item.status === "draft" ? "Menunggu finalisasi wali kelas" : "Hanya admin berizin yang dapat mengoreksi"}</span>}</td></tr>)}</tbody></table></div>
    </section>)}</div>}
  </div>;
}
