import { z } from "zod";

const uuid = z.string().uuid();
const dateOnly = z.iso.date();

export const calendarDaySchema = z.object({
  academic_year_id: uuid,
  calendar_date: dateOnly,
  day_type: z.enum(["school_day", "holiday", "special_school_day", "special_holiday"]),
  title: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const attendanceRecordSchema = z.object({
  record_id: uuid,
  class_group_id: uuid,
  attendance_date: dateOnly,
  status: z.enum(["present", "late", "sick", "permitted", "absent"]),
  arrival_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const finalizeAttendanceSchema = z.object({
  session_id: uuid,
  class_group_id: uuid,
  attendance_date: dateOnly,
});

export const attendanceCorrectionSchema = z.object({
  record_id: uuid,
  status: z.enum(["present", "late", "sick", "permitted", "absent"]),
  arrival_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal("")).optional(),
  notes: z.string().trim().max(1000).optional(),
  reason: z.string().trim().min(5).max(500),
});
