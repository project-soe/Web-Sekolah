import { describe, expect, it } from "vitest";
import { loginSchema } from "@/features/auth/schema";

describe("teacher login input", () => {
  it("accepts a valid email and non-empty password", () => {
    expect(loginSchema.safeParse({ email: "guru@sekolah.sch.id", password: "password123" }).success).toBe(true);
  });

  it("rejects invalid email and empty password", () => {
    expect(loginSchema.safeParse({ email: "bukan-email", password: "" }).success).toBe(false);
  });
});
