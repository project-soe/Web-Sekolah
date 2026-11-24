import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Data Siswa" };
export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  active: "Aktif",
  graduated: "Lulus",
  transferred: "Pindah",
  withdrawn: "Keluar",
};

export default async function AdminStudentsPage() {
  await requirePermission("students:view");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, nis, full_name, gender, enrollment_year, status, departments(name)")
    .order("full_name")
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Data Siswa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Data induk siswa bersifat privat dan hanya tersedia bagi petugas berwenang.
        </p>
      </header>
      {error ? (
        <ErrorState
          title="Gagal memuat data siswa"
          description="Pastikan migrasi database Modul Siswa sudah diterapkan dan akun memiliki permission students:view."
        />
      ) : !data?.length ? (
        <EmptyState
          title="Belum ada data siswa"
          description="Database siswa sudah siap. Tahap berikutnya adalah formulir tambah, edit, pencarian, dan pengelolaan status."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">NIS</th>
                  <th className="px-5 py-3 font-medium">Nama siswa</th>
                  <th className="px-5 py-3 font-medium">Jurusan</th>
                  <th className="px-5 py-3 font-medium">Tahun masuk</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((student) => {
                  const department = Array.isArray(student.departments)
                    ? student.departments[0]
                    : student.departments;
                  return (
                    <tr key={student.id}>
                      <td className="px-5 py-4 font-mono">{student.nis}</td>
                      <td className="px-5 py-4 font-semibold">{student.full_name}</td>
                      <td className="px-5 py-4">{department?.name ?? "—"}</td>
                      <td className="px-5 py-4">{student.enrollment_year}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {statusLabels[student.status] ?? student.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
