"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { fetchAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "./schema";

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
      email: String(formData.get("email") ?? ""),
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    // Pesan sengaja generik agar tidak membocorkan apakah email terdaftar.
    if (error) {
      return { error: "Email atau password salah.", email: parsed.data.email };
    }

    const access = await fetchAccess(supabase);
    if (!access || access.roles.length === 0) {
      await supabase.auth.signOut();
      return { error: "Akun belum aktif atau belum memiliki akses.", email: parsed.data.email };
    }
    await logActivity(supabase, { action: "login", module: "auth", summary: "Login berhasil" });
  } catch (error) {
    console.error(
      "[auth:login] Unexpected error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return {
      error: "Layanan login sedang bermasalah. Silakan coba beberapa saat lagi.",
      email: parsed.data.email,
    };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await logActivity(supabase, { action: "logout", module: "auth", summary: "Logout" });
  await supabase.auth.signOut();
  redirect("/login");
}
