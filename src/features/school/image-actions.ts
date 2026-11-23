"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { validateUpload, randomObjectPath } from "@/lib/storage/validate";
import { createClient } from "@/lib/supabase/server";

const kindSchema = z.enum(["logo", "hero"]);
const COLUMN = { logo: "logo_path", hero: "hero_image_path" } as const;
const LABEL = { logo: "logo", hero: "foto utama" } as const;

export type ImageActionResult = { ok: boolean; path?: string | null; error?: string };

async function authorize() {
  const session = await getSession();
  return session && can(session.access, "school:update") ? session : null;
}

export async function uploadSchoolImage(
  kindInput: string,
  formData: FormData,
): Promise<ImageActionResult> {
  const kind = kindSchema.safeParse(kindInput);
  if (!kind.success) return { ok: false, error: "Jenis gambar tidak valid." };
  if (!(await authorize()))
    return { ok: false, error: "Anda tidak memiliki izin untuk mengubah gambar sekolah." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "File tidak ditemukan." };

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const check = validateUpload("media", { size: file.size, declaredMime: file.type, head });
  if (!check.ok) return { ok: false, error: check.error };

  const column = COLUMN[kind.data];
  const path = randomObjectPath("school", check.ext);

  try {
    const supabase = await createClient();
    const { data: current } = await supabase.from("school_settings").select(column).maybeSingle();
    const oldPath = (current as Record<string, string | null> | null)?.[column] ?? null;

    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: check.mime, cacheControl: "31536000", upsert: false });
    if (upErr) {
      console.error("school_image_upload_failed", upErr.message);
      return { ok: false, error: "Gagal mengunggah gambar." };
    }

    const { data: updated, error: dbErr } = await supabase
      .from("school_settings")
      .update({ [column]: path })
      .eq("id", true)
      .select("id");
    if (dbErr || !updated || updated.length === 0) {
      await supabase.storage.from("media").remove([path]);
      console.error("school_image_db_failed", dbErr?.code ?? "no_rows");
      return { ok: false, error: "Gambar gagal disimpan." };
    }

    if (oldPath) await supabase.storage.from("media").remove([oldPath]);
    await logActivity(supabase, {
      action: "upload",
      module: "school",
      entityType: "school_settings",
      summary: `Mengganti ${LABEL[kind.data]} sekolah`,
      changes: { kind: kind.data },
    });
  } catch (e) {
    console.error("school_image_error", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true, path };
}

export async function removeSchoolImage(kindInput: string): Promise<ImageActionResult> {
  const kind = kindSchema.safeParse(kindInput);
  if (!kind.success) return { ok: false, error: "Jenis gambar tidak valid." };
  if (!(await authorize())) return { ok: false, error: "Anda tidak memiliki izin." };

  const column = COLUMN[kind.data];
  try {
    const supabase = await createClient();
    const { data: current } = await supabase.from("school_settings").select(column).maybeSingle();
    const oldPath = (current as Record<string, string | null> | null)?.[column] ?? null;

    const { data: updated, error } = await supabase
      .from("school_settings")
      .update({ [column]: null })
      .eq("id", true)
      .select("id");
    if (error || !updated || updated.length === 0)
      return { ok: false, error: "Gagal menghapus gambar." };

    if (oldPath) await supabase.storage.from("media").remove([oldPath]);
    await logActivity(supabase, {
      action: "delete",
      module: "school",
      entityType: "school_settings",
      summary: `Menghapus ${LABEL[kind.data]} sekolah`,
      changes: { kind: kind.data },
    });
  } catch (e) {
    console.error("school_image_remove_error", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true, path: null };
}
