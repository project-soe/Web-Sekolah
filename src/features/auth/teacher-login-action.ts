"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchAccess } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";
import { loginSchema } from "./schema";
import { canUseTeacherLogin } from "./teacher-login-policy";

export type TeacherLoginState = { error?: string; email?: string };

export async function loginTeacher(_prev: TeacherLoginState, formData: FormData): Promise<TeacherLoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data tidak valid.",
      email: String(formData.get("email") ?? ""),
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      return { error: "Email atau password salah.", email: parsed.data.email };
    }

    const access = await fetchAccess(supabase);
    if (!access || !canUseTeacherLogin(access.roles)) {
      await supabase.auth.signOut();
      return {
        error: "Akun ini tidak memiliki akses guru. Gunakan halaman masuk sesuai jenis akun.",
        email: parsed.data.email,
      };
    }

    if (access.is_super_admin || access.roles.some((role) =>
      ["admin_sekolah", "editor", "operator_ppdb"].includes(role)
    )) {
      await logActivity(supabase, { action: "login", module: "auth", summary: "Login melalui menu guru" });
      redirect("/admin");
    }

    await logActivity(supabase, { action: "login", module: "auth", summary: "Login guru berhasil" });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth:teacher-login] Unexpected error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan login sedang bermasalah. Silakan coba beberapa saat lagi.", email: parsed.data.email };
  }

  redirect("/ruang-guru");
}
