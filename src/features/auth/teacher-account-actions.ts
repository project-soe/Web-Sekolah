"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const teacherSignupSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  password_confirmation: z.string(),
  invitation_token: z.string().regex(/^[0-9a-f]{64}$/),
}).refine((value) => value.password === value.password_confirmation, {
  path: ["password_confirmation"],
  message: "Konfirmasi password tidak sama.",
});

export async function verifyTeacherAccountOtp(
  _prev: { error?: string; message?: string; awaitingOtp?: boolean; email?: string },
  formData: FormData,
): Promise<{ error?: string; message?: string; awaitingOtp?: boolean; email?: string }> {
  const parsed = z.object({
    email: z.email().transform((value) => value.trim().toLowerCase()),
    token: z.string().trim().regex(/^\d{6}$/, "Masukkan kode OTP 6 digit."),
  }).safeParse({
    email: String(formData.get("email") ?? "").trim(),
    token: String(formData.get("token") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Kode OTP tidak valid.", email: String(formData.get("email") ?? ""), awaitingOtp: true };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "signup",
  });
  if (error || !data.user) {
    return { error: "Kode OTP salah atau kedaluwarsa. Periksa email atau minta kode baru.", email: parsed.data.email, awaitingOtp: true };
  }
  const invitationToken = data.user.user_metadata?.teacher_invitation_token;
  if (typeof invitationToken !== "string" || !/^[0-9a-f]{64}$/.test(invitationToken)) {
    await supabase.auth.signOut();
    return { error: "Metadata undangan tidak ditemukan. Hubungi admin sekolah.", email: parsed.data.email };
  }
  const { error: claimError } = await supabase.rpc("claim_teacher_account_invitation", {
    p_token: invitationToken,
  });
  if (claimError) {
    await supabase.auth.signOut();
    return { error: "Undangan tidak dapat diklaim. Minta admin memeriksa atau menerbitkan ulang undangan.", email: parsed.data.email };
  }
  await supabase.auth.updateUser({ data: { teacher_invitation_token: null } });
  redirect("/ruang-guru");
}

export async function resendTeacherAccountOtp(
  _prev: { error?: string; message?: string; email?: string; awaitingOtp?: boolean },
  formData: FormData,
): Promise<{ error?: string; message?: string; email?: string; awaitingOtp?: boolean }> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: "Masukkan email undangan yang valid." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { error: "Pengiriman email sedang dibatasi. Tunggu sebelum meminta kode baru.", email: parsed.data };
    }
    return { error: "Kode belum dapat dikirim. Pastikan akun masih menunggu verifikasi atau hubungi admin.", email: parsed.data };
  }
  return { message: "Kode OTP dikirim jika akun masih menunggu verifikasi.", email: parsed.data, awaitingOtp: true };
}

export async function registerTeacherAccount(
  _prev: { error?: string; message?: string; awaitingOtp?: boolean; email?: string },
  formData: FormData,
): Promise<{ error?: string; message?: string; awaitingOtp?: boolean; email?: string }> {
  const parsed = teacherSignupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data aktivasi tidak valid." };
  const input = parsed.data;

  try {
    const supabase = await createClient();
    const { data: invitationValid, error: validationError } = await supabase.rpc(
      "validate_teacher_account_invitation",
      { p_token: input.invitation_token, p_email: input.email },
    );
    if (validationError || invitationValid !== true) {
      return { error: "Email tidak cocok dengan undangan, atau tautan sudah kedaluwarsa/dicabut. Periksa email undangan atau minta admin menerbitkan tautan baru." };
    }
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: "Guru", teacher_invitation_token: input.invitation_token },
      },
    });
    if (error) {
      console.error("[auth:teacher] Signup failed:", error.code ?? "unknown");
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        return { error: "Email sudah terdaftar. Hubungi admin sekolah untuk pemeriksaan akun." };
      }
      if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
        return { error: "Pengiriman email sedang dibatasi. Tunggu sebelum mencoba kembali." };
      }
      return { error: "Aktivasi akun gagal dimulai. Periksa email dan coba kembali." };
    }

    if (data.session) {
      const { error: claimError } = await supabase.rpc("claim_teacher_account_invitation", {
        p_token: input.invitation_token,
      });
      if (claimError) {
        await supabase.auth.signOut();
        return { error: "Undangan tidak dapat diklaim. Minta admin memeriksa atau menerbitkan ulang undangan." };
      }
      await supabase.auth.updateUser({ data: { teacher_invitation_token: null } });
      redirect("/ruang-guru");
    }
    return { message: "Kode verifikasi 6 digit telah dikirim ke email undangan.", awaitingOtp: true, email: input.email };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth:teacher] Signup unexpected error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan aktivasi sedang bermasalah. Silakan coba kembali." };
  }
}
