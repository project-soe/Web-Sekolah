import { describe, expect, it } from "vitest";
import { teacherInputSchema } from "@/features/content/teacher-schema";

const valid = {
  full_name: "Ahmad Fauzi, S.Pd.",
  slug: "ahmad-fauzi-spd",
  employee_number: "198001012006041001",
  position: "Guru Produktif",
  department_id: "",
  education: "S1 Pendidikan",
  biography: "Mengajar dan membimbing peserta didik.",
  email: "guru@example.sch.id",
  sort_order: "0",
  is_published: false,
};

describe("teacherInputSchema", () => {
  it("accepts valid teacher data", () => {
    expect(teacherInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(teacherInputSchema.safeParse({ ...valid, slug: "Nama Guru" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(teacherInputSchema.safeParse({ ...valid, email: "bukan-email" }).success).toBe(false);
  });

  it("rejects a name shorter than two characters", () => {
    expect(teacherInputSchema.safeParse({ ...valid, full_name: "A" }).success).toBe(false);
  });

  it("coerces sort order to an integer", () => {
    expect(teacherInputSchema.parse({ ...valid, sort_order: "12" }).sort_order).toBe(12);
  });
});
