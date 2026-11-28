import { describe, expect, it } from "vitest";
import { loginSchema } from "@/features/auth/schema";
import { canUseTeacherLogin } from "@/features/auth/teacher-login-policy";

describe("teacher login policy", () => {
  it("allows accounts with the teacher role", () => {
    expect(canUseTeacherLogin(["guru"])).toBe(true);
    expect(canUseTeacherLogin(["siswa", "guru"])).toBe(true);
  });

  it("rejects accounts without the teacher role", () => {
    expect(canUseTeacherLogin(["siswa"])).toBe(false);
    expect(canUseTeacherLogin(["admin_sekolah"])).toBe(false);
    expect(canUseTeacherLogin(null)).toBe(false);
  });

  it("validates the login credentials", () => {
    expect(loginSchema.safeParse({ email: "guru@sekolah.sch.id", password: "password123" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "bukan-email", password: "" }).success).toBe(false);
  });
});
