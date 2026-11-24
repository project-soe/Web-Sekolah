"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { facilityInputSchema } from "./facility-schema";

function fail(code: string): never { redirect(`/admin/fasilitas?error=${code}`); }

export async function publishFacility(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail("validasi");

  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "facilities:update") || !can(session.access, "facilities:publish")) fail("publikasi");

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("facilities")
    .select("id, name, is_published").eq("id", id).maybeSingle();
  if (readError || !item) fail("simpan");
  if (item.is_published) redirect("/admin/fasilitas");

  const { data: published, error } = await supabase.from("facilities")
    .update({ is_published: true }).eq("id", id).select("id").maybeSingle();
  if (error || !published) {
    console.error("admin_facility_publish_failed", error?.code ?? "no_rows");
    fail("publikasi");
  }

  await logActivity(supabase, {
    action: "publish", module: "facilities", entityType: "facility",
    entityId: id, summary: "Mempublikasikan fasilitas",
    changes: { is_published: true },
  });
  revalidatePath("/fasilitas");
  revalidatePath("/admin/fasilitas");
  redirect("/admin/fasilitas?saved=1");
}

export async function saveFacility(formData: FormData): Promise<void> {
  const parsed = facilityInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) fail("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "facilities:update" : "facilities:create")) fail("akses");

  const supabase = await createClient();
  let existing: { id: string; is_published: boolean; image_path: string | null } | null = null;
  if (isUpdate) {
    const { data, error } = await supabase.from("facilities")
      .select("id, is_published, image_path").eq("id", input.id!).maybeSingle();
    if (error || !data) fail("simpan");
    existing = data;
  }
  if ((existing?.is_published || input.is_published) && !can(session.access, "facilities:publish")) fail("publikasi");

  const fileValue = formData.get("image");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  let uploadedPath: string | null = null;
  if (file) {
    const check = validateUpload("media", {
      size: file.size, declaredMime: file.type,
      head: new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    });
    if (!check.ok) fail("file");
    uploadedPath = randomObjectPath("facilities", check.ext);
    const uploaded = await supabase.storage.from("media").upload(uploadedPath, file, {
      contentType: check.mime, cacheControl: "31536000", upsert: false,
    });
    if (uploaded.error) {
      console.error("admin_facility_upload_failed", uploaded.error.message);
      fail("unggah");
    }
  }

  const payload = {
    name: input.name, slug: input.slug, facility_type: input.facility_type,
    description: input.description?.trim() || null, location: input.location?.trim() || null,
    capacity: input.capacity, sort_order: input.sort_order, is_published: input.is_published,
    image_path: uploadedPath ?? existing?.image_path ?? null,
  };
  const result = isUpdate
    ? await supabase.from("facilities").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("facilities").insert(payload).select("id").single();

  if (result.error || !result.data) {
    if (uploadedPath) await supabase.storage.from("media").remove([uploadedPath]);
    console.error("admin_facility_save_failed", result.error?.code ?? "no_rows");
    fail("simpan");
  }
  if (uploadedPath && existing?.image_path) {
    const removed = await supabase.storage.from("media").remove([existing.image_path]);
    if (removed.error) console.error("admin_facility_old_image_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: input.is_published ? "publish" : isUpdate ? "update" : "create",
    module: "facilities", entityType: "facility", entityId: result.data.id,
    summary: isUpdate ? "Memperbarui data fasilitas" : "Menambahkan data fasilitas",
    changes: { facility_type: input.facility_type, is_published: input.is_published, slug: input.slug, image_changed: Boolean(uploadedPath) },
  });
  revalidatePath("/fasilitas");
  revalidatePath("/admin/fasilitas");
  redirect("/admin/fasilitas?saved=1");
}

export async function deleteFacility(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "facilities:delete")) fail("akses");
  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("facilities")
    .select("id, image_path").eq("id", id).maybeSingle();
  if (readError || !item) fail("hapus");
  const { error } = await supabase.from("facilities").delete().eq("id", id);
  if (error) { console.error("admin_facility_delete_failed", error.code); fail("hapus"); }
  if (item.image_path) {
    const removed = await supabase.storage.from("media").remove([item.image_path]);
    if (removed.error) console.error("admin_facility_storage_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: "delete", module: "facilities", entityType: "facility",
    entityId: id, summary: "Menghapus data fasilitas",
  });
  revalidatePath("/fasilitas");
  revalidatePath("/admin/fasilitas");
  redirect("/admin/fasilitas?deleted=1");
}
