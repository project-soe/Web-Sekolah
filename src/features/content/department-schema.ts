import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const departmentInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(1).max(160).regex(slugPattern),
  description: z.string().trim().max(5000).optional(),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
  is_published: z.boolean(),
});

export type DepartmentInput = z.infer<typeof departmentInputSchema>;
