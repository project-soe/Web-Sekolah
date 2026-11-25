import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { approveStudentPortalRegistration, rejectStudentPortalRegistration } from "@/features/students/portal-actions";
import { can } from "@/lib/rbac/access";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pendaftaran Portal Siswa" };
export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export default async function StudentPortalRequestsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const session = await requirePermission("students:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("student_portal_registration_requests")
    .select("id, email, requested_full_name, requested_nis, requested_birth_date, created_at")
    .eq("status", "pending").order("created_at", { ascending: true }).limit(100);

  return <div className="flex flex-col gap-6">
    <header><h1 className="text-2xl font-bold">Pendaftaran Portal Siswa</h1>
      <p className="mt-1 text-sm text-muted-foreground">Periksa identitas pendaftar. Persetujuan hanya berhasil jika NIS, nama, dan tanggal lahir cocok persis dengan satu data siswa aktif.</p></header>
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">{params.saved === "approved" ? "Pendaftaran berhasil disetujui dan akun diaktifkan." : "Pendaftaran ditolak."}</p>}
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
      {params.error === "akses" ? "Akun tidak memiliki izin untuk memproses pendaftaran."
        : params.error === "cocok" ? "Data tidak cocok. Periksa NIS, nama, dan tanggal lahir pada data induk."
        : params.error === "duplikat" ? "Siswa atau akun sudah terhubung ke Portal Siswa."
        : "Pendaftaran gagal diproses. Muat ulang dan coba kembali."}
    </p>}
    {error ? <ErrorState title="Gagal memuat pendaftaran" description="Periksa koneksi database dan permission akun." />
      : !data?.length ? <EmptyState title="Belum ada pendaftaran tertunda" description="Pengajuan akun mandiri yang masuk akan tampil di sini." />
      : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr>
          <th className="px-5 py-3 font-medium">Nama pendaftar</th><th className="px-5 py-3 font-medium">NIS</th>
          <th className="px-5 py-3 font-medium">Tanggal lahir</th><th className="px-5 py-3 font-medium">Email akun</th>
          <th className="px-5 py-3 font-medium">Diajukan</th><th className="px-5 py-3 text-right font-medium">Tindakan</th>
        </tr></thead>
        <tbody className="divide-y divide-border">{data.map((item) => <tr key={item.id}>
          <td className="px-5 py-4 font-semibold">{item.requested_full_name}</td>
          <td className="px-5 py-4 font-mono">{item.requested_nis}</td>
          <td className="px-5 py-4">{item.requested_birth_date}</td>
          <td className="px-5 py-4">{item.email}</td>
          <td className="px-5 py-4 text-muted-foreground">{formatDate(item.created_at)}</td>
          <td className="px-5 py-4"><div className="flex justify-end gap-2">
            {can(session.access, "students:update") && <>
              <form action={approveStudentPortalRegistration}><input type="hidden" name="request_id" value={item.id} /><button className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">Setujui</button></form>
              <form action={rejectStudentPortalRegistration}><input type="hidden" name="request_id" value={item.id} /><button className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Tolak</button></form>
            </>}
          </div></td>
        </tr>)}</tbody>
      </table></CardContent></Card>}
  </div>;
}
