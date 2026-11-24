import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const announcementInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200),
  slug: z.string().trim().min(1, "Slug wajib diisi").max(200).regex(slugPattern, "Gunakan huruf kecil, angka, dan tanda hubung"),
  summary: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, "Isi pengumuman wajib diisi").max(30000),
  attachment_path: z.string().trim().max(1000).optional(),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().optional(),
  expires_at: z.string().optional(),
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
