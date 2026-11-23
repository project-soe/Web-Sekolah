import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";
import { NewsEditor } from "@/features/content/news-editor";

export const metadata: Metadata = { title: "Tambah Berita" };
export const dynamic = "force-dynamic";

export default async function CreateNewsPage() {
  const session = await requirePermission("news:create");
  const supabase = await createClient();
  const { data: categories } = await supabase.from("news_categories").select("id, name").order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/berita" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke berita</Link>
        <h1 className="mt-3 text-2xl font-bold">Tambah Berita</h1>
        <p className="mt-1 text-sm text-muted-foreground">Simpan sebagai draft atau jadwalkan publikasi.</p>
      </div>
      <NewsEditor categories={categories ?? []} canPublish={can(session.access, "news:publish")} />
    </div>
  );
}
