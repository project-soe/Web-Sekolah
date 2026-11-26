"use server";

import { headers } from "next/headers";
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

export async function registerTeacherAccount(
  _prev: { error?: string; message?: string },
  formData: FormData,
): Promise<{ error?: string; message?: string }> {
  const parsed = teacherSignupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data aktivasi tidak valid." };
  const input = parsed.data;

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return { error: "Alamat website tidak dapat ditentukan." };
    const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const emailRedirectTo = `${protocol}://${host}/auth/callback?next=/ruang-guru`;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: "Guru", teacher_invitation_token: input.invitation_token },
        emailRedirectTo,
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
    return { message: "Akun dibuat. Periksa email dan klik tautan verifikasi sebelum masuk ke Ruang Guru." };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth:teacher] Signup unexpected error:", error instanceof Error ? error.message : "Unknown");
    return { error: "Layanan aktivasi sedang bermasalah. Silakan coba kembali." };
  }
}
