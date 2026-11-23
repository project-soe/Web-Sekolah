import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { DeleteNewsForm } from "@/features/content/delete-news-form";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Kelola Berita" };
export const dynamic = "force-dynamic";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; deleted?: string }>;
}) {
  const session = await requirePermission("news:view");
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("news")
    .select("id, title, slug, status, published_at, updated_at")
    .order("updated_at", { ascending: false }).limit(100);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Berita</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola berita, draft, dan jadwal publikasi.</p>
        </div>
        {can(session.access, "news:create") && (
          <Link href="/admin/berita/tambah" className={buttonVariants({ size: "md" })}>
            <Plus className="size-4" aria-hidden /> Tambah berita
          </Link>
        )}
      </header>

      {params.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut."
            : params.error === "publikasi" ? "Anda tidak memiliki izin publikasi."
            : params.error === "jadwal" ? "Waktu publikasi tidak valid."
            : params.error === "validasi" ? "Data belum valid. Periksa formulir."
            : params.error === "hapus" ? "Berita gagal dihapus."
            : "Berita gagal disimpan. Periksa slug dan coba lagi."}
        </p>
      )}
      {params.saved && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Berita berhasil disimpan.</p>}
      {params.deleted && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Berita berhasil dihapus.</p>}

      {error ? <ErrorState title="Gagal memuat berita" description="Periksa koneksi database dan permission akun." />
        : !data?.length ? <EmptyState title="Belum ada berita" description="Buat berita pertama untuk mulai mengisi website." />
        : <Card><CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Judul</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Diperbarui</th><th className="px-5 py-3 text-right font-medium">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">/berita/{item.slug}</p></td>
                  <td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{item.status === "published" ? (item.published_at && new Date(item.published_at) > new Date() ? "Terjadwal" : "Terbit") : item.status === "archived" ? "Arsip" : "Draft"}</span></td>
                  <td className="px-5 py-4 text-muted-foreground">{new Date(item.updated_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2">
                    {can(session.access, "news:update") && <Link href={`/admin/berita/${item.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>}
                    {can(session.access, "news:delete") && <DeleteNewsForm id={item.id} title={item.title} />}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>}
    </div>
  );
}
