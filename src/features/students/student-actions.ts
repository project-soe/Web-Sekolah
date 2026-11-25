"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";
import { studentInputSchema } from "./student-schema";

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
    console.error("admin_students_save_failed", result.error?.code ?? "no_rows");
    redirect("/admin/siswa?error=" + (result.error?.code === "23505" ? "duplikat" : "simpan"));
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
