"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import {
  attendanceCorrectionSchema,
  attendanceRecordSchema,
  calendarDaySchema,
  finalizeAttendanceSchema,
} from "./schema";

function redirectCalendar(error?: string) {
  redirect(error ? "/admin/kalender-pendidikan?error=" + error : "/admin/kalender-pendidikan?saved=1");
}

async function requireTeacherAttendance(permission: "attendance:create" | "attendance:update" | "attendance:finalize") {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.access.roles.includes("guru") || !can(session.access, permission)) {
    redirect("/ruang-guru?error=akses");
  }
  return session;
}

export async function saveAcademicCalendarDay(formData: FormData): Promise<void> {
  const parsed = calendarDaySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirectCalendar("validasi");
  const session = await getSession();
  if (!session || (!session.access.is_super_admin && !can(session.access, "attendance:calendar_manage"))) {
    redirectCalendar("akses");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_academic_calendar_day", {
    p_academic_year_id: parsed.data.academic_year_id,
    p_calendar_date: parsed.data.calendar_date,
    p_day_type: parsed.data.day_type,
    p_title: parsed.data.title || null,
    p_notes: parsed.data.notes || null,
  });
  if (error || !data) {
    console.error("[attendance:calendar] Save failed:", error?.code ?? "no_result");
    redirectCalendar(error?.code === "23514" ? "rentang" : "simpan");
  }
  await logActivity(supabase, {
    action: "create", module: "attendance", entityType: "academic_calendar_day",
    entityId: data, summary: "Memperbarui kalender pendidikan",
    changes: { date: parsed.data.calendar_date, day_type: parsed.data.day_type },
  });
  revalidatePath("/admin/kalender-pendidikan");
  redirectCalendar();
}

export async function deleteAcademicCalendarDay(formData: FormData): Promise<void> {
  const id = String(formData.get("calendar_day_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirectCalendar("validasi");
  const session = await getSession();
  if (!session || (!session.access.is_super_admin && !can(session.access, "attendance:calendar_manage"))) {
    redirectCalendar("akses");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_academic_calendar_day", { p_calendar_day_id: id });
  if (error) {
    console.error("[attendance:calendar] Delete failed:", error.code);
    redirectCalendar(error.code === "23514" ? "terpakai" : "simpan");
  }
  await logActivity(supabase, {
    action: "delete", module: "attendance", entityType: "academic_calendar_day",
    entityId: id, summary: "Menghapus hari pada kalender pendidikan",
  });
  revalidatePath("/admin/kalender-pendidikan");
  redirectCalendar();
}

export async function createAttendanceSession(formData: FormData): Promise<void> {
  const classGroupId = String(formData.get("class_group_id") ?? "");
  const attendanceDate = String(formData.get("attendance_date") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(classGroupId) || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    redirect("/ruang-guru/absensi?error=validasi");
  }
  await requireTeacherAttendance("attendance:create");
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_attendance_session", {
    p_class_group_id: classGroupId,
    p_attendance_date: attendanceDate,
  });
  if (error) {
    console.error("[attendance:session] Create failed:", error.code);
    redirect("/ruang-guru/absensi?error=" + (error.code === "42501" ? "akses" : error.code === "23514" ? "kalender" : "simpan"));
  }
  revalidatePath("/ruang-guru/absensi");
  redirect("/ruang-guru/absensi/" + classGroupId + "?date=" + attendanceDate);
}

export async function setAttendanceRecord(formData: FormData): Promise<void> {
  const parsed = attendanceRecordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/ruang-guru/absensi?error=validasi");
  await requireTeacherAttendance("attendance:update");
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_attendance_record", {
    p_record_id: parsed.data.record_id,
    p_status: parsed.data.status,
    p_arrival_time: parsed.data.arrival_time || null,
    p_notes: parsed.data.notes || null,
  });
  if (error) {
    console.error("[attendance:record] Update failed:", error.code);
    redirect("/ruang-guru/absensi/" + parsed.data.class_group_id + "?date=" + parsed.data.attendance_date + "&error=" + (error.code === "42501" ? "terkunci" : "simpan"));
  }
  revalidatePath("/ruang-guru/absensi/" + parsed.data.class_group_id);
  redirect("/ruang-guru/absensi/" + parsed.data.class_group_id + "?date=" + parsed.data.attendance_date + "&saved=1");
}

export async function finalizeAttendanceSession(formData: FormData): Promise<void> {
  const parsed = finalizeAttendanceSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/ruang-guru/absensi?error=validasi");
  await requireTeacherAttendance("attendance:finalize");
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalize_attendance_session", {
    p_session_id: parsed.data.session_id,
  });
  if (error) {
    console.error("[attendance:session] Finalize failed:", error.code);
    redirect("/ruang-guru/absensi/" + parsed.data.class_group_id + "?date=" + parsed.data.attendance_date + "&error=" + (error.code === "42501" ? "terkunci" : error.code === "23514" ? "belum_lengkap" : "simpan"));
  }
  await logActivity(supabase, {
    action: "status_change", module: "attendance", entityType: "attendance_session",
    entityId: parsed.data.session_id, summary: "Memfinalisasi absensi rombel",
  });
  revalidatePath("/ruang-guru/absensi");
  revalidatePath("/portal");
  redirect("/ruang-guru/absensi/" + parsed.data.class_group_id + "?date=" + parsed.data.attendance_date + "&finalized=1");
}

export async function correctAttendanceRecord(formData: FormData): Promise<void> {
  const parsed = attendanceCorrectionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin/absensi?error=validasi");
  const session = await getSession();
  if (!session || (!session.access.is_super_admin && !can(session.access, "attendance:correct"))) {
    redirect("/admin/absensi?error=akses");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_attendance_record", {
    p_record_id: parsed.data.record_id,
    p_new_status: parsed.data.status,
    p_new_arrival_time: parsed.data.arrival_time || null,
    p_new_notes: parsed.data.notes || null,
    p_reason: parsed.data.reason,
  });
  if (error) {
    console.error("[attendance:correction] Failed:", error.code);
    redirect("/admin/absensi?error=simpan");
  }
  await logActivity(supabase, {
    action: "update", module: "attendance", entityType: "attendance_record",
    entityId: parsed.data.record_id, summary: "Mengoreksi catatan absensi setelah finalisasi",
    changes: { new_status: parsed.data.status, reason: parsed.data.reason },
  });
  revalidatePath("/admin/absensi");
  revalidatePath("/portal");
  redirect("/admin/absensi?saved=koreksi");
}
