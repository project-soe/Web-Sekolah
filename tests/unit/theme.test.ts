import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, themeSchema } from "@/features/settings/theme-schema";
import { contrastRatio } from "@/utils/color";

describe("contrastRatio", () => {
  it("hitam di atas putih = 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  it("warna yang sama = 1:1", () => {
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });
});

describe("themeSchema", () => {
  it("menerima tema bawaan", () => {
    expect(themeSchema.safeParse(DEFAULT_THEME).success).toBe(true);
  });
  it("menolak format warna yang bukan #RRGGBB, termasuk upaya menyisipkan CSS", () => {
    for (const bad of ["red", "#12345", "#12345g", "#fff;}body{display:none"]) {
      expect(themeSchema.safeParse({ primary: bad, secondary: "#dcebff" }).success).toBe(false);
    }
  });
  it("menolak warna utama yang terlalu terang untuk teks putih", () => {
    expect(themeSchema.safeParse({ primary: "#ffff00", secondary: "#dcebff" }).success).toBe(false);
  });
  it("menolak warna sekunder yang kontrasnya rendah terhadap warna utama", () => {
    expect(themeSchema.safeParse({ primary: "#0b1f4b", secondary: "#0d2354" }).success).toBe(false);
  });
  it("menormalkan huruf besar menjadi huruf kecil", () => {
    const r = themeSchema.parse({ primary: "#0B1F4B", secondary: "#DCEBFF" });
    expect(r.primary).toBe("#0b1f4b");
  });
});
