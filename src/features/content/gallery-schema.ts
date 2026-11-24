import { z } from "zod";

export const galleryInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
});

export type GalleryInput = z.infer<typeof galleryInputSchema>;
