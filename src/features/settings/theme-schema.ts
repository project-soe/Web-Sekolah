import { z } from "zod";
import { contrastRatio } from "@/utils/color";

export const MIN_CONTRAST = 4.5;
export const DEFAULT_THEME = { primary: "#0b1f4b", secondary: "#dcebff" } as const;

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Format warna harus #RRGGBB")
  .transform((v) => v.toLowerCase());

export const themeSchema = z.object({ primary: hex, secondary: hex }).superRefine((t, ctx) => {
  if (contrastRatio(t.primary, "#ffffff") < MIN_CONTRAST) {
    ctx.addIssue({
      code: "custom",
      path: ["primary"],
      message: "Terlalu terang: teks putih di atasnya sulit dibaca",
    });
  }
  if (contrastRatio(t.primary, t.secondary) < MIN_CONTRAST) {
    ctx.addIssue({
      code: "custom",
      path: ["secondary"],
      message: "Kontras dengan warna utama terlalu rendah",
    });
  }
});

export type Theme = z.infer<typeof themeSchema>;
