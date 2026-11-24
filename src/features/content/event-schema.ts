import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const eventInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(1).max(180).regex(slugPattern),
  summary: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(20000),
  location: z.string().trim().max(240).optional().or(z.literal("")),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().or(z.literal("")),
  registration_url: z.string().trim().url().refine((value) => value.startsWith("https://"), "URL harus menggunakan HTTPS").optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  published_at: z.string().optional().or(z.literal("")),
  sort_order: z.coerce.number().int().min(-100000).max(100000),
});

export type EventInput = z.infer<typeof eventInputSchema>;
