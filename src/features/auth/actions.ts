"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { logActivity } from "@/lib/activity/log";
import { fetchAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, studentPortalSignupSchema } from "./schema";

export type LoginState = { error?: string; email?: string };
export type SignupState = { error?: string; message?: string; email?: string };

function getSignupErrorMessage(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    case "email_address_invalid":
      return "Alamat email tidak valid. Periksa kembali penulisannya.";
    case "weak_password":
      return "Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi yang lebih kuat.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak percobaan pendaftaran. Tunggu beberapa saat sebelum mencoba lagi.";
    case "signup_disabled":
      return "Pendaftaran akun sedang dinonaktifkan. Hubungi admin sekolah.";
    case "email_provider_disabled":
      return "Pendaftaran dengan email sedang tidak tersedia. Hubungi admin sekolah.";
    case "validation_failed":
      return "Data akun ditolak oleh layanan autentikasi. Periksa format email dan ketentuan password.";
    default:
      if (message?.toLowerCase().includes("database error saving new user")) {
        return "Layanan gagal menyiapkan profil akun di database. Data siswa belum diproses; silakan hubungi admin sekolah.";
      }
      return "Layanan autentikasi menolak pendaftaran. Periksa apakah email sudah digunakan, lalu coba kembali beberapa saat lagi.";
  }
}

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
    else if (access.roles.includes("guru") && !access.is_super_admin
      && !access.roles.some((role) => ["admin_sekolah", "editor", "operator_ppdb"].includes(role))) {
      destination = "/ruang-guru";
    }
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
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) {
      return { error: "Alamat website tidak dapat ditentukan. Silakan coba kembali atau hubungi admin sekolah.", email: input.email };
    }
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
    const emailRedirectTo = `${protocol}://${host}/auth/callback?next=/portal/menunggu`;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: metadata, emailRedirectTo },
    });
    if (error) {
      console.error("[auth:portal] Signup failed:", { code: error.code ?? "unknown", status: error.status ?? null });
      return { error: getSignupErrorMessage(error.code, error.message), email: input.email };
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

export async function retryStudentPortalRegistration(
  _prev: { error?: string; message?: string },
  formData: FormData,
): Promise<{ error?: string; message?: string }> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { error: "Sesi konfirmasi tidak ditemukan. Silakan masuk kembali." };

  const metadata = authData.user.user_metadata ?? {};
  const metadataAvailable = metadata.portal_registration === "student"
    && typeof metadata.portal_registration_full_name === "string"
    && typeof metadata.portal_registration_nis === "string"
    && typeof metadata.portal_registration_birth_date === "string";
  const submitted = z.object({
    full_name: z.string().trim().min(2).max(150),
    nis: z.string().trim().min(1).max(30),
    birth_date: z.iso.date(),
  }).safeParse({
    full_name: metadataAvailable ? metadata.portal_registration_full_name : formData.get("full_name"),
    nis: metadataAvailable ? metadata.portal_registration_nis : formData.get("nis"),
    birth_date: metadataAvailable ? metadata.portal_registration_birth_date : formData.get("birth_date"),
  });
  if (!submitted.success) {
    return { error: "Data pendaftaran tidak tersimpan di sesi. Isi kembali nama lengkap, NIS, dan tanggal lahir pada formulir pemulihan." };
  }

  const { error } = await supabase.rpc("submit_student_portal_registration", {
    p_full_name: submitted.data.full_name,
    p_nis: submitted.data.nis,
    p_birth_date: submitted.data.birth_date,
  });
  if (error && error.code !== "23505") {
    console.error("[auth:portal] Registration retry failed:", {
      code: error.code, message: error.message, details: error.details, hint: error.hint,
    });
    return { error: `Pengajuan masih gagal disimpan (kode ${error.code ?? "unknown"}). Data akun tetap aman; silakan hubungi admin sekolah.` };
  }
  if (error?.code === "23505") {
    const { data: existingRequest, error: lookupError } = await supabase
      .from("student_portal_registration_requests")
      .select("id")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (lookupError || !existingRequest) {
      console.error("[auth:portal] Registration retry duplicate lookup failed:", lookupError?.code ?? "not_found");
      return { error: "Pengajuan terdeteksi duplikat tetapi antrean belum dapat dipastikan. Hubungi admin sekolah." };
    }
  }

  await clearPortalMetadata(supabase);
  await supabase.auth.signOut();
  redirect("/portal/menunggu");
}

export async function resendStudentPortalConfirmation(
  _prev: { error?: string; message?: string; email?: string },
  formData: FormData,
): Promise<{ error?: string; message?: string; email?: string }> {
  const parsed = z.email("Masukkan alamat email yang valid").safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Email tidak valid." };

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return { error: "Alamat website tidak dapat ditentukan. Silakan coba kembali." };
    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
    const emailRedirectTo = `${protocol}://${host}/auth/callback?next=/portal/menunggu`;
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: { emailRedirectTo },
    });
    if (error) {
      console.error("[auth:portal] Confirmation resend failed:", { code: error.code ?? "unknown", status: error.status ?? null });
      if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
        return { error: "Permintaan email terlalu sering. Tunggu beberapa menit sebelum meminta tautan baru.", email: parsed.data };
      }
      if (error.code === "email_not_confirmed") {
        return { error: "Akun ini sudah terkonfirmasi. Silakan langsung masuk ke Portal Siswa.", email: parsed.data };
      }
      return { error: "Tautan belum dapat dikirim. Pastikan email benar dan akun masih menunggu konfirmasi, atau hubungi admin sekolah.", email: parsed.data };
    }
    return {
      message: "Permintaan tautan konfirmasi berhasil dikirim jika akun masih menunggu verifikasi. Periksa kotak masuk dan folder spam.",
      email: parsed.data,
    };
  } catch (error) {
    console.error("[auth:portal] Confirmation resend unexpected error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan email sedang bermasalah. Silakan coba beberapa saat lagi." };
  }
}

export async function logout() {
  const supabase = await createClient();
  await logActivity(supabase, { action: "logout", module: "auth", summary: "Logout" });
  await supabase.auth.signOut();
  redirect("/login");
}
