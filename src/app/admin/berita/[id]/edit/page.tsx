import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";
import { NewsEditor } from "@/features/content/news-editor";

export const metadata: Metadata = { title: "Edit Berita" };
export const dynamic = "force-dynamic";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("news:view");
  if (!can(session.access, "news:update")) redirect("/admin/berita?error=akses");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: item, error }, { data: categories }] = await Promise.all([
    supabase.from("news").select("id, title, slug, category_id, excerpt, content, status, published_at").eq("id", id).maybeSingle(),
    supabase.from("news_categories").select("id, name").order("name"),
  ]);
  if (error || !item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/berita" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke berita</Link>
        <h1 className="mt-3 text-2xl font-bold">Edit Berita</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui isi dan status publikasi berita.</p>
      </div>
      <NewsEditor initial={item} categories={categories ?? []} canPublish={can(session.access, "news:publish")} />
    </div>
  );
}
