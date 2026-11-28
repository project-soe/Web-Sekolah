"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { isCalendarDate } from "@/features/attendance/date";

type AttendanceEntryInput = { student_id: string; status: string; note: string | null };

const attendanceStatuses = new Set(["present", "late", "sick", "excused", "absent"]);

function isCalendarDate(value: string): boolean {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

async function persistAttendance(formData: FormData, submit: boolean): Promise<void> {
  const classGroupId = String(formData.get("class_group_id") ?? "");
  const attendanceDate = String(formData.get("attendance_date") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(classGroupId) || !isCalendarDate(attendanceDate)) {
    redirect("/ruang-guru?error=validasi");
  }
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "attendance:take") || (submit && !can(session.access, "attendance:submit"))) {
    redirect("/ruang-guru?date=" + encodeURIComponent(attendanceDate) + "&error=akses");
  }

  const entries: AttendanceEntryInput[] = [];
  const seenStudentIds = new Set<string>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status:")) continue;
    const studentId = key.slice("status:".length);
    const status = String(value);
    const note = String(formData.get("note:" + studentId) ?? "").trim();
    if (
      !/^[0-9a-f-]{36}$/i.test(studentId) ||
      seenStudentIds.has(studentId) ||
      (status !== "" && !attendanceStatuses.has(status)) ||
      note.length > 500
    ) {
      redirect("/ruang-guru?date=" + encodeURIComponent(attendanceDate) + "&error=validasi");
    }
    seenStudentIds.add(studentId);
    entries.push({ student_id: studentId, status, note: note || null });
  }

  const supabase = await createClient();
  const { data: sessionId, error } = await supabase.rpc("save_class_attendance", {
    p_class_group_id: classGroupId,
    p_date: attendanceDate,
    p_entries: entries,
  });
  if (error || typeof sessionId !== "string") {
    console.error("teacher_attendance_save_failed", { code: error?.code ?? null, message: error?.message ?? null });
    redirect("/ruang-guru?date=" + encodeURIComponent(attendanceDate) + "&error=" + (error?.code === "42501" ? "akses" : "simpan"));
  }

  if (submit) {
    const result = await supabase.rpc("submit_class_attendance", { p_session_id: sessionId });
    if (result.error) {
      console.error("teacher_attendance_submit_failed", { code: result.error.code, message: result.error.message });
      redirect("/ruang-guru?date=" + encodeURIComponent(attendanceDate) + "&error=" + (result.error.code === "23514" ? "belum_lengkap" : "kirim"));
    }
  }

  revalidatePath("/ruang-guru");
  revalidatePath("/portal");
  redirect("/ruang-guru?date=" + encodeURIComponent(attendanceDate) + "&saved=" + (submit ? "terkirim" : "draft"));
}

export async function saveAttendanceDraft(formData: FormData) {
  return persistAttendance(formData, false);
}

export async function submitAttendance(formData: FormData) {
  return persistAttendance(formData, true);
}
