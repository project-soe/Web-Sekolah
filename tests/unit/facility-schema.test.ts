import { describe, expect, it } from "vitest";
import { facilityInputSchema } from "@/features/content/facility-schema";

const valid = {
  name: "Laboratorium Komputer",
  slug: "laboratorium-komputer",
  facility_type: "laboratorium",
  description: "Laboratorium praktik komputer.",
  location: "Gedung A lantai 2",
  capacity: "30",
  sort_order: "0",
  is_published: false,
};

describe("facilityInputSchema", () => {
  it("accepts valid facility data", () => {
    expect(facilityInputSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an invalid slug", () => {
    expect(facilityInputSchema.safeParse({ ...valid, slug: "Lab Komputer" }).success).toBe(false);
  });
  it("rejects unsupported facility types", () => {
    expect(facilityInputSchema.safeParse({ ...valid, facility_type: "kelas" }).success).toBe(false);
  });
  it("allows an empty capacity", () => {
    expect(facilityInputSchema.parse({ ...valid, capacity: "" }).capacity).toBeNull();
  });
  it("rejects capacity outside the database limit", () => {
    expect(facilityInputSchema.safeParse({ ...valid, capacity: "100001" }).success).toBe(false);
  });
});
