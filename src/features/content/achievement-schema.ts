import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const achievementInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(180),
  slug: z.string().trim().min(1).max(180).regex(slugPattern, "Gunakan huruf kecil, angka, dan tanda hubung"),
  description: z.string().trim().min(1).max(10000),
  recipient: z.string().trim().max(180).optional().or(z.literal("")),
  achievement_level: z.enum(["Sekolah", "Kabupaten/Kota", "Provinsi", "Nasional", "Internasional"]),
  achievement_date: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
});

export type AchievementInput = z.infer<typeof achievementInputSchema>;
