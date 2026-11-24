import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DeleteEventForm } from "@/features/content/delete-event-form";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Kelola Agenda" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const session = await requirePermission("events:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("events")
    .select("id, title, slug, starts_at, status, published_at, updated_at")
    .order("starts_at", { ascending: false }).limit(100);
  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Agenda Sekolah</h1><p className="mt-1 text-sm text-muted-foreground">Kelola kegiatan, lokasi, jadwal, dan publikasi agenda.</p></div>
      {can(session.access, "events:create") && <Link href="/admin/agenda/tambah" className={buttonVariants({ size: "md" })}><Plus className="size-4" aria-hidden /> Tambah agenda</Link>}
    </header>
    {params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
      {params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut."
        : params.error === "publikasi" ? "Anda tidak memiliki izin publikasi."
        : params.error === "tanggal" ? "Tanggal atau waktu agenda tidak valid."
        : params.error === "rentang" ? "Waktu selesai harus setelah waktu mulai."
        : params.error === "jadwal" ? "Waktu publikasi tidak valid."
        : params.error === "validasi" ? "Data belum valid. Periksa formulir."
        : params.error === "file" ? "Format atau ukuran gambar tidak diizinkan."
        : params.error === "unggah" ? "Gambar gagal diunggah."
        : params.error === "hapus" ? "Agenda gagal dihapus."
        : "Agenda gagal disimpan. Periksa slug dan coba lagi."}
    </p>}
    {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Agenda berhasil disimpan.</p>}
    {params.deleted && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Agenda berhasil dihapus.</p>}
    {error ? <ErrorState title="Gagal memuat agenda" description="Periksa koneksi database dan permission akun." />
      : !data?.length ? <EmptyState title="Belum ada agenda" description="Tambahkan kegiatan sekolah pertama." />
      : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr>
          <th className="px-5 py-3 font-medium">Kegiatan</th><th className="px-5 py-3 font-medium">Waktu mulai</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Aksi</th>
        </tr></thead><tbody className="divide-y divide-border">{data.map((item) => <tr key={item.id}>
          <td className="px-5 py-4"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">/agenda/{item.slug}</p></td>
          <td className="px-5 py-4">{new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(item.starts_at))}</td>
          <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.status === "published" ? (item.published_at && new Date(item.published_at) > new Date() ? "Terjadwal" : "Terbit") : item.status === "archived" ? "Arsip" : "Draft"}</span></td>
          <td className="px-5 py-4 text-muted-foreground">{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
          <td className="px-5 py-4"><div className="flex justify-end gap-2">
            {can(session.access, "events:update") && <Link href={`/admin/agenda/${item.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>}
            {can(session.access, "events:delete") && <DeleteEventForm id={item.id} title={item.title} />}
          </div></td>
        </tr>)}</tbody></table></CardContent></Card>}
  </div>;
}
