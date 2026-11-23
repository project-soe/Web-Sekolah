"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { themeSchema } from "./theme-schema";

export type ThemeFormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function authorize() {
  const session = await getSession();
  return session && can(session.access, "settings:update") ? session : null;
}

export async function saveTheme(
  _prev: ThemeFormState,
  formData: FormData,
): Promise<ThemeFormState> {
  const session = await authorize();
  if (!session) return { error: "Anda tidak memiliki izin untuk mengubah tema." };

  const parsed = themeSchema.safeParse({
    primary: formData.get("primary"),
    secondary: formData.get("secondary"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, error: "Warna tidak memenuhi syarat keterbacaan." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "theme.colors", value: parsed.data, is_public: true, updated_by: session.userId },
        { onConflict: "key" },
      )
      .select("key");
    if (error || !data || data.length === 0) {
      console.error("theme_save_failed", error?.code ?? "no_rows");
      return { error: "Tema gagal disimpan." };
    }
    await logActivity(supabase, {
      action: "update",
      module: "settings",
      entityType: "site_settings",
      entityId: "theme.colors",
      summary: "Memperbarui warna tema situs",
      changes: parsed.data,
    });
  } catch (e) {
    console.error("theme_save_error", e instanceof Error ? e.message : "unknown");
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetTheme(): Promise<{ ok: boolean; error?: string }> {
  if (!(await authorize())) return { ok: false, error: "Anda tidak memiliki izin." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("site_settings").delete().eq("key", "theme.colors");
    if (error) {
      console.error("theme_reset_failed", error.code);
      return { ok: false, error: "Gagal mengembalikan warna bawaan." };
    }
    await logActivity(supabase, {
      action: "delete",
      module: "settings",
      entityType: "site_settings",
      entityId: "theme.colors",
      summary: "Mengembalikan warna tema ke bawaan",
    });
  } catch (e) {
    console.error("theme_reset_error", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
