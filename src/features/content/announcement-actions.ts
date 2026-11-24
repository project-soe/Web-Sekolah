"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { announcementInputSchema } from "./announcement-schema";

function localDateTimeToIso(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function saveAnnouncement(formData: FormData): Promise<void> {
  const parsed = announcementInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin/pengumuman?error=validasi");

  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "announcements:update" : "announcements:create")) {
    redirect("/admin/pengumuman?error=akses");
  }
  if (input.status === "published" && !can(session.access, "announcements:publish")) {
    redirect("/admin/pengumuman?error=publikasi");
  }

  const publishedAt = input.status === "published"
    ? localDateTimeToIso(input.published_at) ?? (input.published_at ? null : new Date().toISOString())
    : null;
  const expiresAt = input.expires_at ? localDateTimeToIso(input.expires_at) : null;
  if ((input.status === "published" && !publishedAt) || (input.expires_at && !expiresAt)) {
    redirect("/admin/pengumuman?error=jadwal");
  }
  if (expiresAt && publishedAt && new Date(expiresAt) <= new Date(publishedAt)) {
    redirect("/admin/pengumuman?error=rentang");
  }

  const payload = {
    title: input.title,
    slug: input.slug,
    summary: input.summary?.trim() || null,
    content: input.content,
    attachment_path: input.attachment_path?.trim() || null,
    status: input.status,
    published_at: publishedAt,
    expires_at: expiresAt,
    ...(isUpdate ? {} : { author_id: session.userId }),
  };

  const supabase = await createClient();
  const result = isUpdate
    ? await supabase.from("announcements").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("announcements").insert(payload).select("id").single();

  if (result.error || !result.data) {
    console.error("admin_announcement_save_failed", result.error?.code ?? "no_rows");
    redirect("/admin/pengumuman?error=simpan");
  }

  await logActivity(supabase, {
    action: input.status === "published" ? "publish" : isUpdate ? "update" : "create",
    module: "announcements",
    entityType: "announcement",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui pengumuman" : "Membuat pengumuman",
    changes: { status: input.status, slug: input.slug, expires_at: expiresAt },
  });

  revalidatePath("/pengumuman");
  revalidatePath(`/pengumuman/${input.slug}`);
  revalidatePath("/admin/pengumuman");
  redirect("/admin/pengumuman?saved=1");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/pengumuman?error=validasi");
  const session = await getSession();
  if (!session || !can(session.access, "announcements:delete")) {
    redirect("/admin/pengumuman?error=akses");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    console.error("admin_announcement_delete_failed", error.code);
    redirect("/admin/pengumuman?error=hapus");
  }

  await logActivity(supabase, {
    action: "delete",
    module: "announcements",
    entityType: "announcement",
    entityId: id,
    summary: "Menghapus pengumuman",
  });
  revalidatePath("/pengumuman");
  revalidatePath("/admin/pengumuman");
  redirect("/admin/pengumuman?deleted=1");
}
