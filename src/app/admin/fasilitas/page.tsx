import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DeleteFacilityForm } from "@/features/content/delete-facility-form";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Kelola Fasilitas" };
export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; deleted?: string }> }) {
  const session = await requirePermission("facilities:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("facilities")
    .select("id, name, slug, facility_type, location, is_published, sort_order, updated_at")
    .order("sort_order").order("name").limit(300);
  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Fasilitas Sekolah</h1><p className="mt-1 text-sm text-muted-foreground">Kelola gedung, ruang, laboratorium, dan fasilitas pendukung.</p></div>
      {can(session.access,"facilities:create") && <Link href="/admin/fasilitas/tambah" className={buttonVariants({size:"md"})}><Plus className="size-4" aria-hidden /> Tambah fasilitas</Link>}
    </header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
      {params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut." : params.error === "publikasi" ? "Anda tidak memiliki izin publikasi fasilitas." : params.error === "validasi" ? "Data belum valid." : params.error === "file" ? "Format atau ukuran foto tidak diizinkan." : params.error === "unggah" ? "Foto gagal diunggah." : params.error === "hapus" ? "Fasilitas gagal dihapus." : "Fasilitas gagal disimpan. Periksa slug dan coba lagi."}
    </p>}
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Fasilitas berhasil disimpan.</p>}
    {params.deleted && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Fasilitas berhasil dihapus.</p>}
    {error ? <ErrorState title="Gagal memuat fasilitas" description="Periksa koneksi database dan permission akun." /> : !data?.length ? <EmptyState title="Belum ada fasilitas" description="Tambahkan fasilitas pertama sekolah." /> :
      <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Fasilitas</th><th className="px-5 py-3 font-medium">Jenis</th><th className="px-5 py-3 font-medium">Lokasi</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Aksi</th></tr></thead>
        <tbody className="divide-y divide-border">{data.map(item => <tr key={item.id}>
          <td className="px-5 py-4"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">/fasilitas · {item.slug}</p></td>
          <td className="px-5 py-4">{item.facility_type}</td><td className="px-5 py-4">{item.location || "—"}</td>
          <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.is_published ? "Tampil" : "Draft"}</span></td>
          <td className="px-5 py-4 text-muted-foreground">{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
          <td className="px-5 py-4"><div className="flex justify-end gap-2">{can(session.access,"facilities:update") && <Link href={`/admin/fasilitas/${item.id}/edit`} className={buttonVariants({variant:"outline",size:"sm"})}>Edit</Link>}{can(session.access,"facilities:delete") && <DeleteFacilityForm id={item.id} name={item.name} />}</div></td>
        </tr>)}</tbody>
      </table></CardContent></Card>}
  </div>;
}
