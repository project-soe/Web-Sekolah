"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { randomObjectPath, validateUpload } from "@/lib/storage/validate";
import { galleryInputSchema } from "./gallery-schema";

function localDateTimeToIso(value: string | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)));
  if (
    check.getUTCFullYear() !== Number(year) || check.getUTCMonth() !== Number(month) - 1 ||
    check.getUTCDate() !== Number(day) || check.getUTCHours() !== Number(hour) ||
    check.getUTCMinutes() !== Number(minute)
  ) return null;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function galleryError(code: string): never {
  redirect(`/admin/galeri?error=${code}`);
}

export async function saveGallery(formData: FormData): Promise<void> {
  const parsed = galleryInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) galleryError("validasi");
  const input = parsed.data;
  const isUpdate = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, isUpdate ? "galleries:update" : "galleries:create")) galleryError("akses");
  if (input.status === "published" && !can(session.access, "galleries:publish")) galleryError("publikasi");

  const files = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 20) galleryError("jumlah");
  if (files.length > 0 && !can(session.access, "galleries:update")) galleryError("akses");

  const publishedAt = input.status === "published"
    ? localDateTimeToIso(input.published_at) ?? (input.published_at ? null : new Date().toISOString())
    : null;
  if (input.status === "published" && !publishedAt) galleryError("jadwal");

  const supabase = await createClient();
  const payload = {
    title: input.title,
    slug: input.slug,
    description: input.description?.trim() || null,
    status: input.status,
    published_at: publishedAt,
    sort_order: input.sort_order,
  };
  const result = isUpdate
    ? await supabase.from("galleries").update(payload).eq("id", input.id!).select("id, cover_path").maybeSingle()
    : await supabase.from("galleries").insert(payload).select("id, cover_path").single();
  if (result.error || !result.data) {
    console.error("admin_gallery_save_failed", result.error?.code ?? "no_rows");
    galleryError("simpan");
  }

  const { data: lastImage } = files.length
    ? await supabase.from("gallery_images").select("sort_order")
        .eq("gallery_id", result.data.id).order("sort_order", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const nextSortOrder = (lastImage?.sort_order ?? -1) + 1;
  const uploadedPaths: string[] = [];
  const imageRows: { gallery_id: string; image_path: string; alt_text: string; sort_order: number }[] = [];
  for (const [index, file] of files.entries()) {
    const check = validateUpload("media", {
      size: file.size,
      declaredMime: file.type,
      head: new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    });
    if (!check.ok) {
      if (uploadedPaths.length) await supabase.storage.from("media").remove(uploadedPaths);
      if (!isUpdate) await supabase.from("galleries").delete().eq("id", result.data.id);
      galleryError("file");
    }
    const path = randomObjectPath("galleries", check.ext);
    const uploaded = await supabase.storage.from("media").upload(path, file, {
      contentType: check.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploaded.error) {
      if (uploadedPaths.length) await supabase.storage.from("media").remove(uploadedPaths);
      if (!isUpdate) await supabase.from("galleries").delete().eq("id", result.data.id);
      console.error("admin_gallery_upload_failed", uploaded.error.message);
      galleryError("unggah");
    }
    uploadedPaths.push(path);
    imageRows.push({
      gallery_id: result.data.id,
      image_path: path,
      alt_text: file.name.replace(/\.[^.]+$/, "").slice(0, 200) || input.title,
      sort_order: nextSortOrder + index,
    });
  }

  if (imageRows.length) {
    const inserted = await supabase.from("gallery_images").insert(imageRows);
    if (inserted.error) {
      await supabase.storage.from("media").remove(uploadedPaths);
      if (!isUpdate) await supabase.from("galleries").delete().eq("id", result.data.id);
      console.error("admin_gallery_images_save_failed", inserted.error.code);
      galleryError("simpan-foto");
    }
    if (!result.data.cover_path) {
      await supabase.from("galleries").update({ cover_path: uploadedPaths[0] }).eq("id", result.data.id);
    }
    await logActivity(supabase, {
      action: "upload",
      module: "galleries",
      entityType: "gallery",
      entityId: result.data.id,
      summary: `Mengunggah ${imageRows.length} foto galeri`,
      changes: { count: imageRows.length },
    });
  }

  await logActivity(supabase, {
    action: input.status === "published" ? "publish" : isUpdate ? "update" : "create",
    module: "galleries",
    entityType: "gallery",
    entityId: result.data.id,
    summary: isUpdate ? "Memperbarui album galeri" : "Membuat album galeri",
    changes: { status: input.status, slug: input.slug, uploaded_images: imageRows.length },
  });

  revalidatePath("/galeri");
  revalidatePath(`/galeri/${input.slug}`);
  revalidatePath("/admin/galeri");
  redirect("/admin/galeri?saved=1");
}

export async function deleteGalleryImage(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) galleryError("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "galleries:update")) galleryError("akses");

  const supabase = await createClient();
  const { data: image } = await supabase.from("gallery_images")
    .select("id, gallery_id, image_path").eq("id", imageId).maybeSingle();
  if (!image) galleryError("hapus-foto");
  const { data: gallery } = await supabase.from("galleries")
    .select("slug, status, cover_path").eq("id", image.gallery_id).maybeSingle();
  if (!gallery) galleryError("hapus-foto");
  if (gallery.status === "published" && !can(session.access, "galleries:publish")) galleryError("publikasi");
  const { error } = await supabase.from("gallery_images").delete().eq("id", imageId);
  if (error) galleryError("hapus-foto");
  const removed = await supabase.storage.from("media").remove([image.image_path]);
  if (removed.error) console.error("admin_gallery_storage_remove_failed", removed.error.message);

  if (gallery.cover_path === image.image_path) {
    const { data: nextImage } = await supabase.from("gallery_images")
      .select("image_path").eq("gallery_id", image.gallery_id).order("sort_order").limit(1).maybeSingle();
    await supabase.from("galleries").update({ cover_path: nextImage?.image_path ?? null }).eq("id", image.gallery_id);
  }
  await logActivity(supabase, {
    action: "delete",
    module: "galleries",
    entityType: "gallery_image",
    entityId: imageId,
    summary: "Menghapus foto dari album",
  });
  revalidatePath("/galeri");
  if (gallery?.slug) revalidatePath(`/galeri/${gallery.slug}`);
  revalidatePath("/admin/galeri");
  redirect("/admin/galeri?saved=1");
}

export async function deleteGallery(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) galleryError("validasi");
  const session = await getSession();
  if (!session || !can(session.access, "galleries:delete")) galleryError("akses");

  const supabase = await createClient();
  const { data: gallery } = await supabase.from("galleries")
    .select("id, slug, gallery_images(image_path)").eq("id", id).maybeSingle();
  if (!gallery) galleryError("hapus");
  const paths = (gallery.gallery_images ?? []).map((image) => image.image_path);
  const { error } = await supabase.from("galleries").delete().eq("id", id);
  if (error) galleryError("hapus");
  if (paths.length) await supabase.storage.from("media").remove(paths);

  await logActivity(supabase, {
    action: "delete",
    module: "galleries",
    entityType: "gallery",
    entityId: id,
    summary: "Menghapus album galeri",
    changes: { image_count: paths.length },
  });
  revalidatePath("/galeri");
  revalidatePath(`/galeri/${gallery.slug}`);
  revalidatePath("/admin/galeri");
  redirect("/admin/galeri?deleted=1");
}
