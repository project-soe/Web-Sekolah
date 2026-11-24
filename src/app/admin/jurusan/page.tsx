import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DeleteDepartmentForm } from "@/features/content/delete-department-form";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Kelola Jurusan" };
export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const session = await requirePermission("departments:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments")
    .select("id, name, slug, is_published, sort_order, updated_at")
    .order("sort_order").order("name").limit(200);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Jurusan dan Program Keahlian</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola informasi, gambar, urutan, dan publikasi jurusan.</p></div>
        {can(session.access, "departments:create") && <Link href="/admin/jurusan/tambah" className={buttonVariants({ size: "md" })}>
          <Plus className="size-4" aria-hidden /> Tambah jurusan</Link>}
      </header>
      {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
        {params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut."
          : params.error === "publikasi" ? "Anda tidak memiliki izin untuk mengubah status publikasi jurusan."
          : params.error === "validasi" ? "Data belum valid. Periksa formulir."
          : params.error === "file" ? "Format atau ukuran gambar tidak diizinkan."
          : params.error === "unggah" ? "Gambar gagal diunggah."
          : params.error === "hapus" ? "Jurusan gagal dihapus."
          : "Jurusan gagal disimpan. Periksa slug dan coba lagi."}
      </p>}
      {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data jurusan berhasil disimpan.</p>}
      {params.deleted && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data jurusan berhasil dihapus.</p>}
      {error ? <ErrorState title="Gagal memuat jurusan" description="Periksa koneksi database dan permission akun." />
        : !data?.length ? <EmptyState title="Belum ada jurusan" description="Tambahkan program keahlian pertama untuk ditampilkan di website." />
        : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr>
            <th className="px-5 py-3 font-medium">Jurusan</th><th className="px-5 py-3 font-medium">Urutan</th>
            <th className="px-5 py-3 font-medium">Visibilitas</th><th className="px-5 py-3 font-medium">Diperbarui</th>
            <th className="px-5 py-3 text-right font-medium">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{data.map((item) => <tr key={item.id}>
            <td className="px-5 py-4"><p className="font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">/jurusan · {item.slug}</p></td>
            <td className="px-5 py-4">{item.sort_order}</td>
            <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.is_published ? "Tampil" : "Disembunyikan"}</span></td>
            <td className="px-5 py-4 text-muted-foreground">{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
            <td className="px-5 py-4"><div className="flex justify-end gap-2">
              {can(session.access, "departments:update") && <Link href={`/admin/jurusan/${item.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>}
              {can(session.access, "departments:delete") && <DeleteDepartmentForm id={item.id} name={item.name} />}
            </div></td>
          </tr>)}</tbody>
        </table></CardContent></Card>}
    </div>
  );
}
