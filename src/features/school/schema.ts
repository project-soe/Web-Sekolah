import { z } from "zod";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter`)
    .transform((v) => (v === "" ? null : v));

const digits = (len: number, label: string) =>
  text(len).refine(
    (v) => v === null || new RegExp(`^\\d{${len}}$`).test(v),
    `${label} harus ${len} digit`,
  );

const choice = (values: readonly string[]) =>
  z
    .string()
    .refine((v) => v === "" || values.includes(v), "Pilihan tidak valid")
    .transform((v) => (v === "" ? null : v));

export const OWNERSHIP = ["negeri", "swasta"] as const;
export const LEVELS = ["SD", "SMP", "SMA", "SMK", "MI", "MTs", "MA", "Lainnya"] as const;

export const schoolIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama sekolah minimal 2 karakter")
    .max(150, "Maksimal 150 karakter"),
  slogan: text(200),
  npsn: digits(8, "NPSN"),
  nss: text(20),
  ownership: choice(OWNERSHIP),
  education_level: choice(LEVELS),
  accreditation: text(30),
  founded_year: text(4)
    .refine((v) => v === null || /^\d{4}$/.test(v), "Tahun harus 4 digit")
    .transform((v) => (v === null ? null : Number(v)))
    .refine((v) => v === null || (v >= 1800 && v <= 2100), "Tahun tidak masuk akal"),
  headmaster_name: text(150),
  address: text(300),
  kecamatan: text(100),
  kabupaten_kota: text(100),
  provinsi: text(100),
  postal_code: digits(5, "Kode pos"),
  phone: text(30),
  whatsapp: text(30),
  email: text(150).refine(
    (v) => v === null || z.email().safeParse(v).success,
    "Format email tidak valid",
  ),
  website: text(200).refine(
    (v) => v === null || /^https?:\/\/\S+$/i.test(v),
    "Harus diawali http:// atau https://",
  ),
});

export type SchoolIdentityInput = z.infer<typeof schoolIdentitySchema>;
