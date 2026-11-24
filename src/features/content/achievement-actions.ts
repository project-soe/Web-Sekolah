"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { achievementInputSchema } from "./achievement-schema";

function error(code: string): never {
  redirect(`/admin/prestasi?error=${code}`);
}

function localDateTimeToIso(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const check = new Date(Date.UTC(+y, +m - 1, +d, +h, +min));
  if (check.getUTCFullYear() !== +y || check.getUTCMonth() !== +m - 1 ||
      check.getUTCDate() !== +d || check.getUTCHours() !== +h || check.getUTCMinutes() !== +min) return null;
  return new Date(`${y}-${m}-${d}T${h}:${min}:00+07:00`).toISOString();
}

function validDate(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : false;
}

export async function saveAchievement(formData: FormData): Promise<void> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = achievementInputSchema.safeParse(raw);
  if (!parsed.success) error("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "achievements:update" : "achievements:create")) error("akses");

  const supabase = await createClient();
  let existing: { id: string; status: string; image_path: string | null } | null = null;
  if (isUpdate) {
    const { data, error: readError } = await supabase.from("achievements")
      .select("id, status, image_path").eq("id", input.id!).maybeSingle();
    if (readError || !data) error("simpan");
    existing = data;
    if ((existing.status === "published" || input.status === "published") &&
        !can(session.access, "achievements:publish")) error("publikasi");
  } else if (input.status === "published" && !can(session.access, "achievements:publish")) {
    error("publikasi");
  }

  const achievementDate = validDate(input.achievement_date ?? "");
  if (achievementDate === false) error("tanggal");
  const publishedAt = input.status === "published"
    ? localDateTimeToIso(input.published_at) ?? (input.published_at ? null : new Date().toISOString())
    : null;
  if (input.status === "published" && !publishedAt) error("jadwal");

  const fileValue = formData.get("image");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  let uploadedPath: string | null = null;
  if (file) {
    const check = validateUpload("media", {
      size: file.size,
      declaredMime: file.type,
      head: new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    });
    if (!check.ok) error("file");
    uploadedPath = randomObjectPath("achievements", check.ext);
    const uploaded = await supabase.storage.from("media").upload(uploadedPath, file, {
      contentType: check.mime, cacheControl: "31536000", upsert: false,
    });
    if (uploaded.error) {
      console.error("admin_achievement_upload_failed", uploaded.error.message);
      error("unggah");
    }
  }

  const payload = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    recipient: input.recipient?.trim() || null,
    achievement_level: input.achievement_level,
    achievement_date: achievementDate,
    status: input.status,
    published_at: publishedAt,
    sort_order: input.sort_order,
    image_path: uploadedPath ?? existing?.image_path ?? null,
  };
  const result = isUpdate
    ? await supabase.from("achievements").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("achievements").insert(payload).select("id").single();
  if (result.error || !result.data) {
    if (uploadedPath) await supabase.storage.from("media").remove([uploadedPath]);
    console.error("admin_achievement_save_failed", result.error?.code ?? "no_rows");
    error("simpan");
  }

  if (uploadedPath && existing?.image_path) {
    const removed = await supabase.storage.from("media").remove([existing.image_path]);
    if (removed.error) console.error("admin_achievement_old_image_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: input.status === "published" ? "publish" : isUpdate ? "update" : "create",
    module: "achievements",
    entityType: "achievement",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui prestasi sekolah" : "Menambahkan prestasi sekolah",
    changes: { status: input.status, slug: input.slug, image_changed: Boolean(uploadedPath) },
  });
  revalidatePath("/prestasi");
  revalidatePath(`/prestasi/${input.slug}`);
  revalidatePath("/admin/prestasi");
  redirect("/admin/prestasi?saved=1");
}

export async function deleteAchievement(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) error("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "achievements:delete")) error("akses");
  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("achievements")
    .select("id, slug, image_path").eq("id", id).maybeSingle();
  if (readError || !item) error("hapus");
  const { error: deleteError } = await supabase.from("achievements").delete().eq("id", id);
  if (deleteError) error("hapus");
  if (item.image_path) {
    const removed = await supabase.storage.from("media").remove([item.image_path]);
    if (removed.error) console.error("admin_achievement_storage_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: "delete", module: "achievements", entityType: "achievement",
    entityId: id, summary: "Menghapus prestasi sekolah",
  });
  revalidatePath("/prestasi");
  revalidatePath(`/prestasi/${item.slug}`);
  revalidatePath("/admin/prestasi");
  redirect("/admin/prestasi?deleted=1");
}
