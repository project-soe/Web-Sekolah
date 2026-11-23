import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicDepartment = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  sort_order: number;
};

export type PublicTeacher = {
  id: string;
  full_name: string;
  slug: string;
  position: string | null;
  education: string | null;
  biography: string | null;
  photo_path: string | null;
  sort_order: number;
  department: { name: string } | null;
};

export const getPublicDepartments = cache(async (): Promise<PublicDepartment[]> => {
  const { data, error } = await createPublicClient()
    .from("departments")
    .select("id, name, slug, description, image_path, sort_order")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("public_departments_failed", error.code);
    return [];
  }

  return (data ?? []) as PublicDepartment[];
});

export const getPublicTeachers = cache(async (): Promise<PublicTeacher[]> => {
  const { data, error } = await createPublicClient()
    .from("teachers")
    .select(
      "id, full_name, slug, position, education, biography, photo_path, sort_order, department:departments(name)",
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) {
    console.error("public_teachers_failed", error.code);
    return [];
  }

  return (data ?? []) as unknown as PublicTeacher[];
});
