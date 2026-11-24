import { z } from "zod";

const uuid = z.string().uuid();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Tanggal tidak valid");

export const academicYearSchema = z.object({
  name: z.string().trim().regex(/^\d{4}\/\d{4}$/, "Gunakan format 2026/2027"),
  start_date: dateOnly,
  end_date: dateOnly,
}).refine((value) => {
  const [start, end] = value.name.split("/").map(Number);
  return end === start + 1 && value.end_date > value.start_date;
}, "Tahun ajaran atau rentang tanggal tidak valid");

export const classGroupSchema = z.object({
  academic_year_id: uuid,
  name: z.string().trim().min(3).max(80),
  grade_level: z.coerce.number().int().min(10).max(12),
  department_id: z.union([uuid, z.literal("")]).optional(),
  homeroom_teacher_id: z.union([uuid, z.literal("")]).optional(),
});

export const classAssignmentSchema = z.object({
  student_id: uuid,
  class_group_id: uuid,
});

export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type ClassGroupInput = z.infer<typeof classGroupSchema>;
