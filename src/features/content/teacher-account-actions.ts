"use server";

import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type TeacherInvitationState = { token?: string; error?: string };

export async function createTeacherAccountInvitation(
  _prev: TeacherInvitationState,
  formData: FormData,
): Promise<TeacherInvitationState> {
  const teacherId = String(formData.get("teacher_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(teacherId)) return { error: "ID profil guru tidak valid." };

  const session = await getSession();
  if (!session) return { error: "Sesi admin berakhir. Silakan masuk kembali." };
  if (!session.access.is_super_admin && !session.access.permissions.includes("teachers:update")) {
    return { error: "Akun tidak memiliki izin mengundang guru." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_teacher_account_invitation", {
    p_teacher_id: teacherId,
  });
  if (error || typeof data !== "string") {
    console.error("[admin:teacher-account] Invitation creation failed:", error?.code ?? "invalid_result");
    return {
      error: error?.code === "23505"
        ? "Email sudah terdaftar atau profil guru sudah memiliki akun. Periksa data akun terlebih dahulu."
        : "Undangan gagal dibuat. Pastikan profil guru memiliki email yang benar.",
    };
  }

  await logActivity(supabase, {
    action: "create",
    module: "teacher_accounts",
    entityType: "teacher",
    entityId: teacherId,
    summary: "Membuat undangan aktivasi akun guru",
  });
  return { token: data };
}

export async function revokeTeacherAccountInvitation(formData: FormData): Promise<void> {
  const teacherId = String(formData.get("teacher_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(teacherId)) return;
  const session = await getSession();
  if (!session || (!session.access.is_super_admin && !session.access.permissions.includes("teachers:update"))) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_teacher_account_invitation", { p_teacher_id: teacherId });
  if (error) {
    console.error("[admin:teacher-account] Invitation revocation failed:", error.code);
    return;
  }
  await logActivity(supabase, {
    action: "revoke", module: "teacher_accounts", entityType: "teacher",
    entityId: teacherId, summary: "Mencabut undangan aktivasi akun guru",
  });
}
