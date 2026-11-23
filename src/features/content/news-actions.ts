"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { newsInputSchema } from "./news-schema";

function publicationTimestamp(value: string | undefined, status: string) {
  if (status !== "published") return null;
  if (!value) return new Date().toISOString();
  const parsed = new Date(`${value}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function saveNews(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = newsInputSchema.safeParse(raw);
  if (!parsed.success) redirect("/admin/berita?error=validasi");

  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "news:update" : "news:create")) {
    redirect("/admin/berita?error=akses");
  }
  if (input.status === "published" && !can(session.access, "news:publish")) {
    redirect("/admin/berita?error=publikasi");
  }

  const publishedAt = publicationTimestamp(input.published_at, input.status);
  if (input.status === "published" && !publishedAt) {
    redirect("/admin/berita?error=jadwal");
  }

  const payload = {
    title: input.title,
    slug: input.slug,
    category_id: input.category_id || null,
    excerpt: input.excerpt?.trim() || null,
    content: input.content,
    status: input.status,
    published_at: publishedAt,
    ...(isUpdate ? {} : { author_id: session.userId }),
  };

  const supabase = await createClient();
  const result = isUpdate
    ? await supabase.from("news").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("news").insert(payload).select("id").single();

  if (result.error || !result.data) {
    console.error("admin_news_save_failed", result.error?.code ?? "no_rows");
    redirect("/admin/berita?error=simpan");
  }

  await logActivity(supabase, {
    action: input.status === "published" ? "publish" : isUpdate ? "update" : "create",
    module: "news",
    entityType: "news",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui berita" : "Membuat berita",
    changes: { status: input.status, slug: input.slug },
  });

  revalidatePath("/berita");
  revalidatePath(`/berita/${input.slug}`);
  revalidatePath("/admin/berita");
  redirect("/admin/berita?saved=1");
}

export async function deleteNews(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/berita?error=validasi");
  const session = await getSession();
  if (!session || !can(session.access, "news:delete")) redirect("/admin/berita?error=akses");

  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) {
    console.error("admin_news_delete_failed", error.code);
    redirect("/admin/berita?error=hapus");
  }

  await logActivity(supabase, {
    action: "delete",
    module: "news",
    entityType: "news",
    entityId: id,
    summary: "Menghapus berita",
  });
  revalidatePath("/berita");
  revalidatePath("/admin/berita");
  redirect("/admin/berita?deleted=1");
}
