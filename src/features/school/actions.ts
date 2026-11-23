"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { schoolIdentitySchema } from "./schema";

export type SchoolFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export async function saveSchoolIdentity(
  _prev: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  const session = await getSession();
  if (!session || !can(session.access, "school:update")) {
    return { error: "Anda tidak memiliki izin untuk mengubah identitas sekolah." };
  }

  const raw: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }

  const parsed = schoolIdentitySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, values: raw, error: "Periksa kembali isian yang ditandai." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("school_settings")
      .update(parsed.data)
      .eq("id", true)
      .select("id");
    if (error || !data || data.length === 0) {
      console.error("school_update_failed", error?.code ?? "no_rows");
      return { error: "Perubahan gagal disimpan.", values: raw };
    }
    await logActivity(supabase, {
      action: "update",
      module: "school",
      entityType: "school_settings",
      summary: "Memperbarui identitas sekolah",
      changes: { fields: Object.keys(parsed.data) },
    });
  } catch (e) {
    console.error("school_update_error", e instanceof Error ? e.message : "unknown");
    return { error: "Terjadi kesalahan. Silakan coba lagi.", values: raw };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
