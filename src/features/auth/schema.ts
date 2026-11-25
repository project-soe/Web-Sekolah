import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});


const dateOnly = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Tanggal lahir tidak valid");

export const studentPortalSignupSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z.email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  invitation_token: z.string().trim().optional().default(""),
  nis: z.string().trim().max(30).optional().default(""),
  birth_date: z.string().optional().default(""),
}).superRefine((value, ctx) => {
  if (value.invitation_token) {
    if (!/^[0-9a-f]{64}$/.test(value.invitation_token)) {
      ctx.addIssue({ code: "custom", path: ["invitation_token"], message: "Token undangan tidak valid" });
    }
    return;
  }
  if (!value.nis) ctx.addIssue({ code: "custom", path: ["nis"], message: "NIS wajib diisi untuk pendaftaran mandiri" });
  if (!dateOnly.safeParse(value.birth_date).success) {
    ctx.addIssue({ code: "custom", path: ["birth_date"], message: "Tanggal lahir wajib diisi dengan benar" });
  }
});
