"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { fetchAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, studentPortalSignupSchema } from "./schema";

export type LoginState = { error?: string; email?: string };
export type SignupState = { error?: string; message?: string; email?: string };

async function clearPortalMetadata(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.auth.updateUser({
    data: {
      portal_invitation_token: null,
      portal_registration: null,
      portal_registration_full_name: null,
      portal_registration_nis: null,
      portal_registration_birth_date: null,
    },
  });
  if (error) console.error("[auth:portal] Metadata cleanup failed:", error.message);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid", email: String(formData.get("email") ?? "") };
  }

  let destination = "/admin";
  try {
    const supabase = await createClient();
    const { data: signedIn, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !signedIn.user) return { error: "Email atau password salah.", email: parsed.data.email };

    let access = await fetchAccess(supabase);
    const metadata = signedIn.user.user_metadata ?? {};
    if (!access?.roles.includes("siswa") && typeof metadata.portal_invitation_token === "string") {
      const { error: claimError } = await supabase.rpc("claim_student_portal_invitation", {
        p_token: metadata.portal_invitation_token,
      });
      if (claimError) {
        console.error("[auth:portal] Invitation claim failed:", claimError.code);
        await supabase.auth.signOut();
        return { error: "Undangan tidak valid atau sudah kedaluwarsa. Minta undangan baru kepada admin.", email: parsed.data.email };
      }
      await clearPortalMetadata(supabase);
      access = await fetchAccess(supabase);
    } else if ((!access || access.roles.length === 0) && metadata.portal_registration === "student") {
      const { error: requestError } = await supabase.rpc("submit_student_portal_registration", {
        p_full_name: metadata.portal_registration_full_name,
        p_nis: metadata.portal_registration_nis,
        p_birth_date: metadata.portal_registration_birth_date,
      });
      if (requestError && requestError.code !== "23505") {
        console.error("[auth:portal] Self-registration submission failed:", requestError.code);
        await supabase.auth.signOut();
        return { error: "Pengajuan akun gagal disimpan. Silakan hubungi admin sekolah.", email: parsed.data.email };
      }
      await clearPortalMetadata(supabase);
      await supabase.auth.signOut();
      return { error: "Pengajuan Portal Siswa diterima dan sedang menunggu verifikasi admin.", email: parsed.data.email };
    }

    if (!access || access.roles.length === 0) {
      await supabase.auth.signOut();
      return { error: "Akun belum aktif atau belum memiliki akses. Jika sudah mendaftar sebagai siswa, tunggu verifikasi admin.", email: parsed.data.email };
    }
    if (access.roles.includes("siswa") && !access.is_super_admin) destination = "/portal";
    await logActivity(supabase, { action: "login", module: "auth", summary: "Login berhasil" });
  } catch (error) {
    console.error("[auth:login] Unexpected error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan login sedang bermasalah. Silakan coba beberapa saat lagi.", email: parsed.data.email };
  }
  redirect(destination);
}

export async function registerStudentPortal(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = studentPortalSignupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data pendaftaran tidak valid", email: String(formData.get("email") ?? "") };
  }
  const input = parsed.data;
  const metadata = input.invitation_token
    ? { full_name: input.full_name, portal_invitation_token: input.invitation_token }
    : {
        full_name: input.full_name,
        portal_registration: "student",
        portal_registration_full_name: input.full_name,
        portal_registration_nis: input.nis,
        portal_registration_birth_date: input.birth_date,
      };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: metadata },
    });
    if (error) {
      console.error("[auth:portal] Signup failed:", error.message);
      return { error: "Pendaftaran akun gagal. Periksa email dan password, lalu coba kembali.", email: input.email };
    }
    if (!data.session) {
      return {
        message: "Pendaftaran akun dimulai. Periksa email untuk menyelesaikan verifikasi, lalu masuk kembali. Pengajuan akan diteruskan setelah akun terverifikasi.",
        email: input.email,
      };
    }

    if (input.invitation_token) {
      const { error: claimError } = await supabase.rpc("claim_student_portal_invitation", { p_token: input.invitation_token });
      if (claimError) {
        console.error("[auth:portal] Immediate invitation claim failed:", claimError.code);
        await supabase.auth.signOut();
        return { error: "Undangan tidak valid atau sudah kedaluwarsa. Hubungi admin untuk meminta undangan baru.", email: input.email };
      }
      await clearPortalMetadata(supabase);
      redirect("/portal");
    }

    const { error: requestError } = await supabase.rpc("submit_student_portal_registration", {
      p_full_name: input.full_name, p_nis: input.nis, p_birth_date: input.birth_date,
    });
    if (requestError) {
      console.error("[auth:portal] Immediate self-registration failed:", requestError.code);
      await supabase.auth.signOut();
      return { error: "Pengajuan akun gagal disimpan. Silakan hubungi admin sekolah.", email: input.email };
    }
    await clearPortalMetadata(supabase);
    await supabase.auth.signOut();
    redirect("/portal/menunggu");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth:portal] Unexpected signup error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan pendaftaran sedang bermasalah. Silakan coba beberapa saat lagi.", email: input.email };
  }
}

export async function logout() {
  const supabase = await createClient();
  await logActivity(supabase, { action: "logout", module: "auth", summary: "Logout" });
  await supabase.auth.signOut();
  redirect("/login");
}
