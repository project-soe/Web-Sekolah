import { z } from "zod";

const dateOnly = z.string().refine((v) => {
  if (!v) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
}, "Tanggal tidak valid");

export const studentInputSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  nis: z.string().trim().min(1, "NIS wajib diisi").max(30),
  nisn: z.string().trim().max(10).regex(/^$|^\d{10}$/, "NISN harus 10 digit").optional().default(""),
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  email: z.union([z.email("Alamat email tidak valid").trim(), z.literal("")]).optional().default(""),
  gender: z.enum(["male", "female"]),
  birth_place: z.string().trim().max(100).optional().default(""),
  birth_date: dateOnly.optional().default(""),
  address: z.string().trim().max(1000).optional().default(""),
  guardian_name: z.string().trim().max(150).optional().default(""),
  guardian_phone: z.string().trim().max(30).regex(/^[0-9+().\-\s]*$/, "Nomor telepon tidak valid").optional().default(""),
  department_id: z.string().uuid().optional().or(z.literal("")),
  enrollment_year: z.coerce.number().int().min(2000).max(2200),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type StudentInput = z.infer<typeof studentInputSchema>;


export const studentLifecycleSchema = z.object({
  student_id: z.string().uuid(),
  new_status: z.enum(["transferred", "withdrawn"]),
});
