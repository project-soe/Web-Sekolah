"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { teacherInputSchema } from "./teacher-schema";

function error(code: string): never {
  redirect(`/admin/guru?error=${code}`);
}

export async function saveTeacher(formData: FormData): Promise<void> {
  const parsed = teacherInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) error("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "teachers:update" : "teachers:create")) error("akses");

  const supabase = await createClient();
  let existing: { id: string; is_published: boolean; photo_path: string | null } | null = null;
  if (isUpdate) {
    const { data, error: readError } = await supabase.from("teachers")
      .select("id, is_published, photo_path").eq("id", input.id!).maybeSingle();
    if (readError || !data) error("simpan");
    existing = data;
  }
  if ((existing?.is_published || input.is_published) && !can(session.access, "teachers:publish")) {
    error("publikasi");
  }

  const fileValue = formData.get("photo");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  let uploadedPath: string | null = null;
  if (file) {
    const check = validateUpload("media", {
      size: file.size,
      declaredMime: file.type,
      head: new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    });
    if (!check.ok) error("file");
    uploadedPath = randomObjectPath("teachers", check.ext);
    const uploaded = await supabase.storage.from("media").upload(uploadedPath, file, {
      contentType: check.mime, cacheControl: "31536000", upsert: false,
    });
    if (uploaded.error) {
      console.error("admin_teacher_upload_failed", uploaded.error.message);
      error("unggah");
    }
  }

  const payload = {
    full_name: input.full_name,
    slug: input.slug,
    employee_number: input.employee_number?.trim() || null,
    position: input.position?.trim() || null,
    department_id: input.department_id || null,
    education: input.education?.trim() || null,
    biography: input.biography?.trim() || null,
    email: input.email?.trim() || null,
    sort_order: input.sort_order,
    is_published: input.is_published,
    photo_path: uploadedPath ?? existing?.photo_path ?? null,
  };

  const result = isUpdate
    ? await supabase.from("teachers").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("teachers").insert(payload).select("id").single();

  if (result.error || !result.data) {
    if (uploadedPath) await supabase.storage.from("media").remove([uploadedPath]);
    console.error("admin_teacher_save_failed", result.error?.code ?? "no_rows");
    error("simpan");
  }

  if (uploadedPath && existing?.photo_path) {
    const removed = await supabase.storage.from("media").remove([existing.photo_path]);
    if (removed.error) console.error("admin_teacher_old_photo_remove_failed", removed.error.message);
  }

  await logActivity(supabase, {
    action: input.is_published ? "publish" : isUpdate ? "update" : "create",
    module: "teachers",
    entityType: "teacher",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui data guru" : "Menambahkan data guru",
    changes: { is_published: input.is_published, slug: input.slug, photo_changed: Boolean(uploadedPath) },
  });
  revalidatePath("/guru");
  revalidatePath("/admin/guru");
  redirect("/admin/guru?saved=1");
}

export async function deleteTeacher(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) error("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "teachers:delete")) error("akses");

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("teachers")
    .select("id, photo_path").eq("id", id).maybeSingle();
  if (readError || !item) error("hapus");
  const { error: deleteError } = await supabase.from("teachers").delete().eq("id", id);
  if (deleteError) error("hapus");

  if (item.photo_path) {
    const removed = await supabase.storage.from("media").remove([item.photo_path]);
    if (removed.error) console.error("admin_teacher_storage_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: "delete", module: "teachers", entityType: "teacher",
    entityId: id, summary: "Menghapus data guru",
  });
  revalidatePath("/guru");
  revalidatePath("/admin/guru");
  redirect("/admin/guru?deleted=1");
}
