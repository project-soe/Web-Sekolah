import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DeleteTeacherForm } from "@/features/content/delete-teacher-form";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Kelola Guru" };
export const dynamic = "force-dynamic";

export default async function AdminTeachersPage({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const session = await requirePermission("teachers:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("teachers")
    .select("id, full_name, slug, position, is_published, updated_at")
    .order("sort_order").order("full_name").limit(200);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Guru dan Tenaga Kependidikan</h1><p className="mt-1 text-sm text-muted-foreground">Kelola profil, jabatan, foto, dan visibilitas guru di website.</p></div>
        {can(session.access, "teachers:create") && <Link href="/admin/guru/tambah" className={buttonVariants({ size: "md" })}><Plus className="size-4" aria-hidden /> Tambah guru</Link>}
      </header>
      {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
        {params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut."
          : params.error === "publikasi" ? "Anda tidak memiliki izin untuk mengubah status publikasi guru."
          : params.error === "validasi" ? "Data belum valid. Periksa formulir."
          : params.error === "file" ? "Format atau ukuran foto tidak diizinkan."
          : params.error === "unggah" ? "Foto gagal diunggah."
          : params.error === "hapus" ? "Data guru gagal dihapus."
          : "Data guru gagal disimpan. Periksa slug dan coba lagi."}
      </p>}
      {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data guru berhasil disimpan.</p>}
      {params.deleted && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data guru berhasil dihapus.</p>}
      {error ? <ErrorState title="Gagal memuat data guru" description="Periksa koneksi database dan permission akun." />
        : !data?.length ? <EmptyState title="Belum ada data guru" description="Tambahkan profil guru dan tenaga kependidikan pertama." />
        : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr>
            <th className="px-5 py-3 font-medium">Nama</th><th className="px-5 py-3 font-medium">Jabatan</th><th className="px-5 py-3 font-medium">Visibilitas</th><th className="px-5 py-3 font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Aksi</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{data.map((item) => <tr key={item.id}>
            <td className="px-5 py-4"><p className="font-semibold">{item.full_name}</p><p className="mt-1 text-xs text-muted-foreground">/guru · {item.slug}</p></td>
            <td className="px-5 py-4">{item.position || "—"}</td>
            <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.is_published ? "Tampil" : "Disembunyikan"}</span></td>
            <td className="px-5 py-4 text-muted-foreground">{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
            <td className="px-5 py-4"><div className="flex justify-end gap-2">
              {can(session.access, "teachers:update") && <Link href={`/admin/guru/${item.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>}
              {can(session.access, "teachers:delete") && <DeleteTeacherForm id={item.id} name={item.full_name} />}
            </div></td>
          </tr>)}</tbody>
        </table></CardContent></Card>}
    </div>
  );
}
