import { z } from "zod";

// Batas panjang harus sama dengan constraint di database (school_profiles).
const longText = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(max, `Maksimal ${max} karakter`))
    .transform((v) => (v === "" ? null : v));

export const PROFILE_FIELDS = [
  { name: "headmaster_message", label: "Sambutan kepala sekolah", max: 5000, rows: 8 },
  { name: "vision", label: "Visi", max: 2000, rows: 4 },
  { name: "mission", label: "Misi", hint: "Tulis satu misi per baris.", max: 5000, rows: 8 },
  { name: "history", label: "Sejarah", max: 10000, rows: 10 },
  { name: "objectives", label: "Tujuan pendidikan", max: 5000, rows: 6 },
] as const;

export const profileSchema = z.object({
  headmaster_message: longText(5000),
  vision: longText(2000),
  mission: longText(5000),
  history: longText(10000),
  objectives: longText(5000),
});
