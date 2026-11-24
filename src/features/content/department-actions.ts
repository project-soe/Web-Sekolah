"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { departmentInputSchema } from "./department-schema";

function fail(code: string): never {
  redirect(`/admin/jurusan?error=${code}`);
}

export async function saveDepartment(formData: FormData): Promise<void> {
  const parsed = departmentInputSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    is_published: formData.get("is_published") === "on",
  });
  if (!parsed.success) fail("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "departments:update" : "departments:create")) fail("akses");

  const supabase = await createClient();
  let existing: { id: string; is_published: boolean; image_path: string | null } | null = null;
  if (isUpdate) {
    const { data, error } = await supabase.from("departments")
      .select("id, is_published, image_path").eq("id", input.id!).maybeSingle();
    if (error || !data) fail("simpan");
    existing = data;
  }
  if ((existing?.is_published || input.is_published) && !can(session.access, "departments:publish")) {
    fail("publikasi");
  }

  const fileValue = formData.get("image");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
  let uploadedPath: string | null = null;
  if (file) {
    const check = validateUpload("media", {
      size: file.size,
      declaredMime: file.type,
      head: new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    });
    if (!check.ok) fail("file");
    uploadedPath = randomObjectPath("departments", check.ext);
    const uploaded = await supabase.storage.from("media").upload(uploadedPath, file, {
      contentType: check.mime, cacheControl: "31536000", upsert: false,
    });
    if (uploaded.error) {
      console.error("admin_department_upload_failed", uploaded.error.message);
      fail("unggah");
    }
  }

  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description?.trim() || null,
    sort_order: input.sort_order,
    is_published: input.is_published,
    image_path: uploadedPath ?? existing?.image_path ?? null,
  };
  const result = isUpdate
    ? await supabase.from("departments").update(payload).eq("id", input.id!).select("id").maybeSingle()
    : await supabase.from("departments").insert(payload).select("id").single();

  if (result.error || !result.data) {
    if (uploadedPath) await supabase.storage.from("media").remove([uploadedPath]);
    console.error("admin_department_save_failed", result.error?.code ?? "no_rows");
    fail("simpan");
  }
  if (uploadedPath && existing?.image_path) {
    const removed = await supabase.storage.from("media").remove([existing.image_path]);
    if (removed.error) console.error("admin_department_old_image_remove_failed", removed.error.message);
  }

  await logActivity(supabase, {
    action: input.is_published ? "publish" : isUpdate ? "update" : "create",
    module: "departments",
    entityType: "department",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui data jurusan" : "Menambahkan data jurusan",
    changes: { is_published: input.is_published, slug: input.slug, image_changed: Boolean(uploadedPath) },
  });
  revalidatePath("/jurusan");
  revalidatePath("/guru");
  revalidatePath("/admin/jurusan");
  revalidatePath("/admin/guru");
  redirect("/admin/jurusan?saved=1");
}

export async function deleteDepartment(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "departments:delete")) fail("akses");

  const supabase = await createClient();
  const { data: item, error: readError } = await supabase.from("departments")
    .select("id, name, image_path").eq("id", id).maybeSingle();
  if (readError || !item) fail("hapus");
  const { error: deleteError } = await supabase.from("departments").delete().eq("id", id);
  if (deleteError) {
    console.error("admin_department_delete_failed", deleteError.code);
    fail("hapus");
  }
  if (item.image_path) {
    const removed = await supabase.storage.from("media").remove([item.image_path]);
    if (removed.error) console.error("admin_department_storage_remove_failed", removed.error.message);
  }
  await logActivity(supabase, {
    action: "delete", module: "departments", entityType: "department",
    entityId: id, summary: "Menghapus data jurusan",
  });
  revalidatePath("/jurusan");
  revalidatePath("/guru");
  revalidatePath("/admin/jurusan");
  revalidatePath("/admin/guru");
  redirect("/admin/jurusan?deleted=1");
}
