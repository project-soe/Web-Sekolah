import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const newsInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200),
  slug: z.string().trim().min(1, "Slug wajib diisi").max(200).regex(slugPattern, "Gunakan huruf kecil, angka, dan tanda hubung"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, "Isi berita wajib diisi").max(50000),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().optional(),
});

export type NewsInput = z.infer<typeof newsInputSchema>;
