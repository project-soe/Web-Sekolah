"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { studentInputSchema, studentLifecycleSchema } from "./student-schema";

export async function saveStudent(formData: FormData): Promise<void> {
  const parsed = studentInputSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin/siswa?error=validasi");
  const input = parsed.data;
  const editing = Boolean(input.id);
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, editing ? "students:update" : "students:create")) redirect("/admin/siswa?error=akses");

  const supabase = await createClient();
  if (editing) {
    const existing = await supabase.from("students").select("id").eq("id", input.id!).maybeSingle();
    if (existing.error || !existing.data) redirect("/admin/siswa?error=tidak_ditemukan");
  }
  const payload = {
    nis: input.nis,
    nisn: input.nisn || null,
    full_name: input.full_name,
    email: input.email ? input.email.trim().toLowerCase() : null,
    gender: input.gender,
    birth_place: input.birth_place || null,
    birth_date: input.birth_date || null,
    address: input.address || null,
    guardian_name: input.guardian_name || null,
    guardian_phone: input.guardian_phone || null,
    department_id: input.department_id || null,
    enrollment_year: input.enrollment_year,
    notes: input.notes || null,
  };

  const result = editing
    ? await supabase
        .from("students")
        .update(payload)
        .eq("id", input.id!)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("students")
        .insert(payload)
        .select("id")
        .single();
  if (result.error || !result.data) {
    console.error("admin_students_save_failed", {
      code: result.error?.code ?? null,
      message: result.error?.message ?? null,
      details: result.error?.details ?? null,
      hint: result.error?.hint ?? null,
    });
    const errorCode = result.error?.code;
    const errorKey = errorCode === "23505" ? "duplikat"
      : errorCode === "42703" || errorCode === "PGRST204" ? "migrasi_email"
      : "simpan";
    redirect("/admin/siswa?error=" + errorKey);
  }
  await logActivity(supabase, {
    action: editing ? "update" : "create",
    module: "students", entityType: "student", entityId: result.data.id,
    summary: editing ? "Memperbarui data siswa" : "Menambahkan data siswa",
    changes: { enrollment_year: input.enrollment_year },
  });
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/siswa/" + result.data.id);
  redirect("/admin/siswa/" + result.data.id + "?saved=1");
}


export async function changeStudentLifecycle(formData: FormData): Promise<void> {
  const parsed = studentLifecycleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin/siswa?error=validasi");
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "students:update") || !can(session.access, "students:view")
    || !can(session.access, "classes:view") || !can(session.access, "classes:update")) {
    redirect("/admin/siswa/" + parsed.data.student_id + "?error=akses");
  }
  const supabase = await createClient();
  const { data: closedCount, error } = await supabase.rpc("transition_student_status", {
    p_student_id: parsed.data.student_id, p_new_status: parsed.data.new_status,
  });
  if (error || typeof closedCount !== "number") {
    console.error("admin_student_lifecycle_failed", error?.code ?? "invalid_result");
    redirect("/admin/siswa/" + parsed.data.student_id + "?error=" +
      (error?.code === "42501" ? "akses" : error?.code === "P0002" ? "tidak_ditemukan" : "lifecycle"));
  }
  await logActivity(supabase, {
    action: "status_change", module: "students", entityType: "student",
    entityId: parsed.data.student_id,
    summary: parsed.data.new_status === "transferred" ? "Mencatat siswa pindah" : "Mencatat siswa mengundurkan diri",
    changes: { new_status: parsed.data.new_status, closed_enrollments: closedCount },
  });
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/siswa/" + parsed.data.student_id);
  revalidatePath("/admin/kelas");
  redirect("/admin/siswa/" + parsed.data.student_id + "?saved=lifecycle");
}


export async function archiveStudent(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || confirmation !== "HAPUS") {
    redirect("/admin/siswa?error=validasi");
  }

  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "students:delete")) redirect("/admin/siswa/" + studentId + "?error=akses");

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_student", { p_student_id: studentId });
  if (error) {
    console.error("admin_student_archive_failed", { code: error.code, message: error.message });
    const key = error.code === "42501" ? "akses"
      : error.code === "P0002" ? "tidak_ditemukan"
      : error.code === "23514" ? "arsip_terkait"
      : "arsip";
    redirect("/admin/siswa/" + studentId + "?error=" + key);
  }

  await logActivity(supabase, {
    action: "delete", module: "students", entityType: "student", entityId: studentId,
    summary: "Mengarsipkan data siswa",
  });
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/siswa/" + studentId);
  redirect("/admin/siswa?archived=1&saved=archived");
}

export async function restoreStudent(formData: FormData): Promise<void> {
  const studentId = String(formData.get("student_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) redirect("/admin/siswa?error=validasi");

  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, "students:update")) redirect("/admin/siswa/" + studentId + "?error=akses");

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_archived_student", { p_student_id: studentId });
  if (error) {
    console.error("admin_student_restore_failed", { code: error.code, message: error.message });
    redirect("/admin/siswa/" + studentId + "?error=" + (error.code === "42501" ? "akses" : "arsip"));
  }

  await logActivity(supabase, {
    action: "restore", module: "students", entityType: "student", entityId: studentId,
    summary: "Memulihkan data siswa dari arsip",
  });
  revalidatePath("/admin/siswa");
  revalidatePath("/admin/siswa/" + studentId);
  redirect("/admin/siswa/" + studentId + "?saved=restored");
}
