"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { can } from "@/lib/rbac/access";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PortalInvitationState = { token?: string; error?: string };

export async function createStudentPortalInvitation(_prev: PortalInvitationState, formData: FormData): Promise<PortalInvitationState> {
  const studentId = String(formData.get("student_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return { error: "ID siswa tidak valid." };
  const session = await getSession();
  if (!session) return { error: "Sesi admin berakhir. Silakan masuk kembali." };
  if (!can(session.access, "students:view") || !can(session.access, "students:update")) return { error: "Akun tidak memiliki izin membuat undangan." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_student_portal_invitation", { p_student_id: studentId });
  if (error || typeof data !== "string") {
    console.error("[admin:student-portal] Invitation creation failed:", error?.code ?? "invalid_result");
    return { error: error?.code === "23505" ? "Siswa sudah memiliki akun Portal Siswa." : "Undangan gagal dibuat. Pastikan siswa masih aktif." };
  }
  await logActivity(supabase, { action: "create", module: "student_portal", entityType: "student", entityId: studentId, summary: "Membuat undangan Portal Siswa" });
  revalidatePath("/admin/siswa/" + studentId);
  return { token: data };
}

export async function approveStudentPortalRegistration(formData: FormData): Promise<void> {
  const requestId = String(formData.get("request_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) redirect("/admin/akses-siswa?error=validasi");
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "students:view") || !can(session.access, "students:update")) redirect("/admin/akses-siswa?error=akses");
  const supabase = await createClient();
  const { data: studentId, error } = await supabase.rpc("approve_student_portal_registration", { p_request_id: requestId });
  if (error || typeof studentId !== "string") {
    console.error("[admin:student-portal] Approval failed:", error?.code ?? "invalid_result");
    redirect("/admin/akses-siswa?error=" + (error?.code === "P0002" ? "cocok" : error?.code === "23505" ? "duplikat" : "proses"));
  }
  await logActivity(supabase, { action: "approve", module: "student_portal", entityType: "student", entityId: studentId, summary: "Menyetujui pendaftaran mandiri Portal Siswa" });
  revalidatePath("/admin/akses-siswa");
  revalidatePath("/admin/siswa/" + studentId);
  redirect("/admin/akses-siswa?saved=approved");
}

export async function rejectStudentPortalRegistration(formData: FormData): Promise<void> {
  const requestId = String(formData.get("request_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) redirect("/admin/akses-siswa?error=validasi");
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "students:view") || !can(session.access, "students:update")) redirect("/admin/akses-siswa?error=akses");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_student_portal_registration", { p_request_id: requestId });
  if (error) {
    console.error("[admin:student-portal] Rejection failed:", error.code);
    redirect("/admin/akses-siswa?error=proses");
  }
  await logActivity(supabase, { action: "reject", module: "student_portal", entityType: "registration_request", entityId: requestId, summary: "Menolak pendaftaran mandiri Portal Siswa" });
  revalidatePath("/admin/akses-siswa");
  redirect("/admin/akses-siswa?saved=rejected");
}
