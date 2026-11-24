import { describe, expect, it } from "vitest";
import { departmentInputSchema } from "@/features/content/department-schema";

const valid = {
  name: "Teknik Komputer dan Jaringan",
  slug: "teknik-komputer-jaringan",
  description: "Program keahlian bidang jaringan komputer.",
  sort_order: "0",
  is_published: false,
};

describe("departmentInputSchema", () => {
  it("accepts valid department data", () => {
    expect(departmentInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(departmentInputSchema.safeParse({ ...valid, slug: "Teknik Komputer" }).success).toBe(false);
  });

  it("rejects a name shorter than two characters", () => {
    expect(departmentInputSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects a description over the database limit", () => {
    expect(departmentInputSchema.safeParse({ ...valid, description: "x".repeat(5001) }).success).toBe(false);
  });

  it("coerces sort order to an integer", () => {
    expect(departmentInputSchema.parse({ ...valid, sort_order: "12" }).sort_order).toBe(12);
  });
});
