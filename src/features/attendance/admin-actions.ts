"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

const statuses = new Set(["present", "late", "sick", "excused", "absent"]);

export async function correctAttendance(formData: FormData): Promise<void> {
  const entryId = String(formData.get("entry_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(entryId) || !statuses.has(status) || reason.length < 5 || reason.length > 500) {
    redirect("/admin/absensi?error=validasi");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "attendance:correct")) redirect("/admin/absensi?error=akses");
  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_attendance_entry", {
    p_entry_id: entryId, p_status: status, p_note: note || null, p_reason: reason,
  });
  if (error) {
    console.error("admin_attendance_correction_failed", { code: error.code, message: error.message });
    redirect("/admin/absensi?error=" + (error.code === "42501" ? "akses" : "koreksi"));
  }
  revalidatePath("/admin/absensi");
  revalidatePath("/portal");
  redirect("/admin/absensi?saved=koreksi");
}

export async function setAttendanceLock(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("session_id") ?? "");
  const lockedValue = String(formData.get("locked") ?? "");
  const locked = lockedValue === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  if (
    !/^[0-9a-f-]{36}$/i.test(sessionId) ||
    (lockedValue !== "true" && lockedValue !== "false") ||
    (!locked && (reason.length < 5 || reason.length > 500)) ||
    (locked && reason.length > 500)
  ) {
    redirect("/admin/absensi?error=validasi");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "attendance:lock")) redirect("/admin/absensi?error=akses");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance_session_lock", {
    p_session_id: sessionId, p_locked: locked, p_reason: reason || null,
  });
  if (error) {
    console.error("admin_attendance_lock_failed", { code: error.code, message: error.message });
    redirect("/admin/absensi?error=" + (error.code === "42501" ? "akses" : "kunci"));
  }
  revalidatePath("/admin/absensi");
  redirect("/admin/absensi?saved=" + (locked ? "dikunci" : "dibuka"));
}
