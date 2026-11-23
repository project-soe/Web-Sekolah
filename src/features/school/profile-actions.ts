"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "./profile-schema";

export type ProfileFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveSchoolProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await getSession();
  if (!session || !can(session.access, "school:update")) {
    return { error: "Anda tidak memiliki izin untuk mengubah profil sekolah." };
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "Periksa kembali isian yang ditandai." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("school_profiles")
      .update(parsed.data)
      .eq("id", true)
      .select("id");
    if (error || !data || data.length === 0) {
      console.error("school_profile_update_failed", error?.code ?? "no_rows");
      return { error: "Perubahan gagal disimpan." };
    }
    await logActivity(supabase, {
      action: "update",
      module: "school",
      entityType: "school_profiles",
      summary: "Memperbarui profil sekolah",
      changes: { fields: Object.keys(parsed.data) },
    });
  } catch (e) {
    console.error("school_profile_error", e instanceof Error ? e.message : "unknown");
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
