import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const facilityTypes = ["gedung", "ruang", "laboratorium", "olahraga", "ibadah", "lainnya"] as const;

export const facilityInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(1).max(160).regex(slugPattern),
  facility_type: z.enum(facilityTypes),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(200).optional(),
  capacity: z.preprocess((value) => value === "" || value == null ? null : value, z.coerce.number().int().min(1).max(100000).nullable()),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
  is_published: z.boolean(),
});
export type FacilityInput = z.infer<typeof facilityInputSchema>;
