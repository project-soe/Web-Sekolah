"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { eventInputSchema } from "./event-schema";

function error(code: string): never {
  redirect(`/admin/agenda?error=${code}`);
}

function localDateTimeToIso(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const check = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute));
  if (check.getUTCFullYear() !== +year || check.getUTCMonth() !== +month - 1 ||
      check.getUTCDate() !== +day || check.getUTCHours() !== +hour || check.getUTCMinutes() !== +minute) return null;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`).toISOString();
}

export async function saveEvent(formData: FormData): Promise<void> {
  const parsed = eventInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) error("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "events:update" : "events:create")) error("akses");

  const supabase = await createClient();
  let existing: { id: string; status: string; image_path: string | null } | null = null;
  if (isUpdate) {
    const { data, error: readError } = await supabase.from("events")
      .select("id, status, image_path").eq("id", input.id!).maybeSingle();
    if (readError || !data) error("simpan");
    existing = data;
    if ((existing.status === "published" || input.status === "published") &&
        !can(session.access, "events:publish")) error("publikasi");
  } else if (input.status === "published" && !can(session.access, "events:publish")) {
    error("publikasi");
  }

  const startsAt = localDateTimeToIso(input.starts_at);
  const endsAt = input.ends_at ? localDateTimeToIso(input.ends_at) : null;
  const publishedAt = input.status === "published"
    ? localDateTimeToIso(input.published_at) ?? (input.published_at ? null : new Date().toISOString())
    : null;
  if (!startsAt || (input.ends_at && !endsAt)) error("tanggal");
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) error("rentang");
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
    uploadedPath = randomObjectPath("events", check.ext);
    const uploaded = await supabase.storage.from("media").upload(uploadedPath, file, {
      contentType: check.mime, cacheControl: "31536000", upsert: false,
    });
    if (uploaded.error) {
      console.error("admin_event_upload_failed", uploaded.error.message);
      error("unggah");
    }
  }

  const payload = {
    title: input.title, slug: input.slug, summary: input.summary?.trim() || null,
    description: input.description, location: input.location?.trim() || null,
    starts_at: startsAt, ends_at: endsAt,
    registration_url: input.registration_url?.trim() || null,
    status: input.status, published_at: publishedAt, sort_order: input.sort_order,
    image_path: uploadedPath ?? existing?.image_path ?? null,
  };
  const result = isUpdate
    ? await supabase.from("events").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("events").insert(payload).select("id").single();
  if (result.error || !result.data) {
    if (uploadedPath) await supabase.storage.from("media").remove([uploadedPath]);
    console.error("admin_event_save_failed", result.error?.code ?? "no_rows");
    error("simpan");
  }
  if (uploadedPath && existing?.image_path) {
    const removed = await supabase.storage.from("media").remove([existing.image_path]);
    if (removed.error) console.error("admin_event_old_image_remove_failed", removed.error.message);
  }

  await logActivity(supabase, {
    action: input.status === "published" ? "publish" : isUpdate ? "update" : "create",
    module: "events", entityType: "event", entityId: result.data.id,
    summary: isUpdate ? "Memperbarui agenda sekolah" : "Menambahkan agenda sekolah",
    changes: { status: input.status, slug: input.slug, starts_at: startsAt, image_changed: Boolean(uploadedPath) },
  });
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${input.slug}`);
  revalidatePath("/admin/agenda");
  redirect("/admin/agenda?saved=1");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) error("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "events:delete")) error("akses");
  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("events")
    .select("id, slug, image_path").eq("id", id).maybeSingle();
  if (readError || !item) error("hapus");
  const { error: deleteError } = await supabase.from("events").delete().eq("id", id);
  if (deleteError) error("hapus");
  if (item.image_path) {
    const removed = await supabase.storage.from("media").remove([item.image_path]);
    if (removed.error) console.error("admin_event_storage_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: "delete", module: "events", entityType: "event",
    entityId: id, summary: "Menghapus agenda sekolah",
  });
  revalidatePath("/agenda");
  revalidatePath(`/agenda/${item.slug}`);
  revalidatePath("/admin/agenda");
  redirect("/admin/agenda?deleted=1");
}
