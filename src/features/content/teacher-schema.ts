import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const teacherInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  full_name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(1).max(180).regex(slugPattern),
  employee_number: z.string().trim().max(40).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  department_id: z.string().uuid().optional().or(z.literal("")),
  education: z.string().trim().max(200).optional().or(z.literal("")),
  biography: z.string().trim().max(5000).optional().or(z.literal("")),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
  is_published: z.boolean(),
});

export type TeacherInput = z.infer<typeof teacherInputSchema>;
