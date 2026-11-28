"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { academicYearSchema, classAssignmentSchema, classGraduationSchema, classGroupSchema } from "./class-schema";

function fail(code: string): never {
  redirect("/admin/kelas?error=" + code);
}

async function requireClassPermission(permission: "classes:create" | "classes:update") {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!can(session.access, permission)) fail("akses");
  return session;
}

export async function createAcademicYear(formData: FormData): Promise<void> {
  const parsed = academicYearSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) fail("validasi");
  await requireClassPermission("classes:create");
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_years").insert({
    ...parsed.data,
    is_active: false,
  }).select("id").single();
  if (error || !data) {
    console.error("admin_academic_year_create_failed", error?.code ?? "no_rows");
    fail(error?.code === "23505" ? "duplikat" : "simpan");
  }
  await logActivity(supabase, {
    action: "create", module: "classes", entityType: "academic_year",
    entityId: data.id, summary: "Menambahkan tahun ajaran",
  });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas?saved=tahun");
}

export async function activateAcademicYear(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail("validasi");
  await requireClassPermission("classes:update");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_academic_year", {
    target_year_id: id,
  });
  if (error || !data) {
    console.error("admin_academic_year_activate_failed", error?.code ?? "no_rows");
    fail(error?.code === "42501" ? "akses" : "simpan");
  }
  await logActivity(supabase, {
    action: "update", module: "classes", entityType: "academic_year",
    entityId: data, summary: "Mengaktifkan tahun ajaran",
  });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas?saved=aktif");
}

export async function createClassGroup(formData: FormData): Promise<void> {
  const parsed = classGroupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) fail("validasi");
  const session = await requireClassPermission("classes:create");
  const supabase = await createClient();
  const { data, error } = await supabase.from("class_groups").insert({
    academic_year_id: parsed.data.academic_year_id,
    name: parsed.data.name,
    grade_level: parsed.data.grade_level,
    capacity: parsed.data.capacity,
    department_id: parsed.data.department_id || null,
    homeroom_teacher_id: parsed.data.homeroom_teacher_id || null,
  }).select("id").single();
  if (error || !data) {
    console.error("admin_class_group_create_failed", error?.code ?? "no_rows");
    fail(error?.code === "23505" ? "duplikat" : "simpan");
  }
  await logActivity(supabase, {
    action: "create", module: "classes", entityType: "class_group",
    entityId: data.id, summary: "Menambahkan rombongan belajar",
    changes: { grade_level: parsed.data.grade_level, capacity: parsed.data.capacity },
  });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas?saved=kelas");
}


export async function updateClassGroup(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/kelas?error=validasi");
  const parsed = classGroupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/admin/kelas/" + id + "?error=validasi");
  await requireClassPermission("classes:update");
  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase.from("class_groups")
    .select("id, academic_year_id").eq("id", id).maybeSingle();
  if (currentError || !current) redirect("/admin/kelas?error=kelas");
  if (current.academic_year_id !== parsed.data.academic_year_id) redirect("/admin/kelas/" + id + "?error=validasi");
  const { error } = await supabase.from("class_groups").update({
    name: parsed.data.name,
    grade_level: parsed.data.grade_level,
    capacity: parsed.data.capacity,
    department_id: parsed.data.department_id || null,
    homeroom_teacher_id: parsed.data.homeroom_teacher_id || null,
  }).eq("id", id);
  if (error) {
    console.error("admin_class_group_update_failed", error.code);
    redirect("/admin/kelas/" + id + "?error=" + (error.code === "23505" ? "duplikat" : error.code === "23514" ? "kapasitas" : "simpan"));
  }
  await logActivity(supabase, {
    action: "update", module: "classes", entityType: "class_group",
    entityId: id, summary: "Memperbarui data rombongan belajar",
    changes: { grade_level: parsed.data.grade_level, capacity: parsed.data.capacity },
  });
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/kelas/" + id);
  redirect("/admin/kelas/" + id + "?saved=kelas");
}

export async function promoteClassStudents(formData: FormData): Promise<void> {
  const sourceClassId = String(formData.get("source_class_id") ?? "");
  const targetClassId = String(formData.get("target_class_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(sourceClassId) || !/^[0-9a-f-]{36}$/i.test(targetClassId)) fail("validasi");
  const session = await requireClassPermission("classes:update");
  if (!can(session.access, "students:update")) fail("akses");
  const supabase = await createClient();
  const { data: count, error } = await supabase.rpc("promote_class_students", {
    source_class_id: sourceClassId, target_class_id: targetClassId,
  });
  if (error || typeof count !== "number" || count < 1) {
    console.error("admin_class_promotion_failed", error?.code ?? "invalid_result");
    fail(error?.code === "42501" ? "akses" : error?.code === "23505" ? "kenaikan_duplikat" : error?.code === "23514" ? "kenaikan_validasi" : "kenaikan");
  }
  await logActivity(supabase, {
    action: "update", module: "classes", entityType: "class_group", entityId: sourceClassId,
    summary: "Menjalankan kenaikan kelas massal",
    changes: { source_class_id: sourceClassId, target_class_id: targetClassId, promoted_count: count },
  });
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  redirect("/admin/kelas?saved=kenaikan&jumlah=" + count);
}

export async function graduateClassStudents(formData: FormData): Promise<void> {
  const parsed = classGraduationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) fail("validasi");
  const session = await requireClassPermission("classes:update");
  if (!can(session.access, "students:update")) fail("akses");
  const supabase = await createClient();
  const { data: count, error } = await supabase.rpc("graduate_class_students", {
    p_source_class_id: parsed.data.source_class_id,
    p_graduation_date: parsed.data.graduation_date,
  });
  if (error || typeof count !== "number" || count < 1) {
    console.error("admin_class_graduation_failed", error?.code ?? "invalid_result");
    fail(error?.code === "42501" ? "akses" : error?.code === "23514" ? "kelulusan_validasi" : error?.code === "P0002" ? "kelulusan_kosong" : "kelulusan");
  }
  await logActivity(supabase, {
    action: "status_change", module: "students", entityType: "class_group",
    entityId: parsed.data.source_class_id, summary: "Meluluskan siswa kelas XII secara massal",
    changes: { source_class_id: parsed.data.source_class_id, graduation_date: parsed.data.graduation_date, graduated_count: count },
  });
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  redirect("/admin/kelas?saved=kelulusan&jumlah=" + count);
}

export async function assignStudentToClass(formData: FormData): Promise<void> {
  const requestedReturnPath = String(formData.get("return_to") ?? "");
  const returnPath = /^\/admin\/kelas\/[0-9a-f-]{36}$/i.test(requestedReturnPath)
    ? requestedReturnPath
    : "/admin/kelas";
  const failAt = (code: string): never => redirect(returnPath + "?error=" + code);
  const parsed = classAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return failAt("validasi");
  const session = await requireClassPermission("classes:update");
  if (!can(session.access, "classes:view") || !can(session.access, "students:view") || !can(session.access, "students:update")) return failAt("akses");
  const supabase = await createClient();
  const { data: activeYear, error: activeYearError } = await supabase.from("academic_years")
    .select("id").eq("is_active", true).maybeSingle();
  if (activeYearError || !activeYear) return failAt("tahun_ajaran");
  const { data: target, error: targetError } = await supabase.from("class_groups")
    .select("id, academic_year_id, name").eq("id", parsed.data.class_group_id).maybeSingle();
  if (targetError || !target) return failAt("kelas");
  if (target.academic_year_id !== activeYear.id) return failAt("tahun_ajaran");
  const { data: student, error: studentError } = await supabase.from("students")
    .select("id, full_name, status").eq("id", parsed.data.student_id).maybeSingle();
  if (studentError || !student || student.status !== "active") return failAt("siswa");

  const { data: previous, error: previousError } = await supabase.from("student_class_enrollments")
    .select("id, class_group_id").eq("student_id", student.id)
    .eq("academic_year_id", target.academic_year_id).maybeSingle();
  if (previousError) return failAt("penempatan");
  if (previous?.class_group_id === target.id) return failAt("penempatan_sama");
  const result = previous
    ? await supabase.from("student_class_enrollments")
        .update({ class_group_id: target.id })
        .eq("id", previous.id).select("id").maybeSingle()
    : await supabase.from("student_class_enrollments").insert({
        student_id: student.id,
        academic_year_id: target.academic_year_id,
        class_group_id: target.id,
        assigned_by: session.userId,
      }).select("id").single();
  if (result.error || !result.data) {
    console.error("admin_student_class_assign_failed", result.error?.code ?? "no_rows");
    fail(result.error?.code === "23514" ? "kapasitas" : "penempatan");
  }
  await logActivity(supabase, {
    action: previous ? "status_change" : "create",
    module: "classes", entityType: "student_class_enrollment",
    entityId: result.data.id,
    summary: previous ? "Memindahkan siswa ke kelas lain" : "Menempatkan siswa ke kelas",
    changes: { academic_year_id: target.academic_year_id, class_group_id: target.id },
  });
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/kelas/" + target.id);
  revalidatePath("/admin/siswa");
  redirect(returnPath + "?saved=penempatan");
}
