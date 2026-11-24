import { describe, expect, it } from "vitest";
import { achievementInputSchema } from "@/features/content/achievement-schema";

const valid = {
  title: "Juara Lomba Kompetensi Siswa",
  slug: "juara-lomba-kompetensi-siswa",
  description: "Meraih juara pertama pada kompetisi tingkat provinsi.",
  recipient: "Tim RPL",
  achievement_level: "Provinsi",
  achievement_date: "2026-10-12",
  status: "draft",
  published_at: "",
  sort_order: "0",
};

describe("achievementInputSchema", () => {
  it("accepts a valid achievement", () => {
    expect(achievementInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(achievementInputSchema.safeParse({ ...valid, slug: "Juara Provinsi" }).success).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(achievementInputSchema.safeParse({ ...valid, description: " " }).success).toBe(false);
  });

  it("rejects an unsupported level", () => {
    expect(achievementInputSchema.safeParse({ ...valid, achievement_level: "Regional" }).success).toBe(false);
  });

  it("coerces the sort order to an integer", () => {
    expect(achievementInputSchema.parse({ ...valid, sort_order: "12" }).sort_order).toBe(12);
  });
});
