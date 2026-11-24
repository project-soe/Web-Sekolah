"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { academicYearSchema, classAssignmentSchema, classGroupSchema } from "./class-schema";

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
    changes: { grade_level: parsed.data.grade_level },
  });
  revalidatePath("/admin/kelas");
  redirect("/admin/kelas?saved=kelas");
}

export async function assignStudentToClass(formData: FormData): Promise<void> {
  const parsed = classAssignmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) fail("validasi");
  const session = await requireClassPermission("classes:update");
  if (!can(session.access, "students:update")) fail("akses");
  const supabase = await createClient();
  const { data: target, error: targetError } = await supabase.from("class_groups")
    .select("id, academic_year_id, name").eq("id", parsed.data.class_group_id).maybeSingle();
  if (targetError || !target) fail("kelas");
  const { data: student, error: studentError } = await supabase.from("students")
    .select("id, full_name, status").eq("id", parsed.data.student_id).maybeSingle();
  if (studentError || !student || student.status !== "active") fail("siswa");

  const { data: previous, error: previousError } = await supabase.from("student_class_enrollments")
    .select("id, class_group_id").eq("student_id", student.id)
    .eq("academic_year_id", target.academic_year_id).maybeSingle();
  if (previousError) fail("penempatan");
  const result = previous
    ? await supabase.from("student_class_enrollments")
        .update({ class_group_id: target.id, updated_by: session.userId })
        .eq("id", previous.id).select("id").maybeSingle()
    : await supabase.from("student_class_enrollments").insert({
        student_id: student.id,
        academic_year_id: target.academic_year_id,
        class_group_id: target.id,
        assigned_by: session.userId,
      }).select("id").single();
  if (result.error || !result.data) {
    console.error("admin_student_class_assign_failed", result.error?.code ?? "no_rows");
    fail("penempatan");
  }
  await logActivity(supabase, {
    action: previous ? "status_change" : "create",
    module: "classes", entityType: "student_class_enrollment",
    entityId: result.data.id,
    summary: previous ? "Memindahkan siswa ke kelas lain" : "Menempatkan siswa ke kelas",
    changes: { academic_year_id: target.academic_year_id, class_group_id: target.id },
  });
  revalidatePath("/admin/kelas");
  revalidatePath("/admin/siswa");
  redirect("/admin/kelas?saved=penempatan");
}
