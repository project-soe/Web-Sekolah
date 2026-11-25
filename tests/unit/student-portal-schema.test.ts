import { describe, expect, it } from "vitest";
import { studentPortalSignupSchema } from "@/features/auth/schema";

const valid = {
  full_name: "Siswa Contoh",
  email: "siswa@example.test",
  password: "Aman12345",
  invitation_token: "",
  self_registration_consent: "true",
  nis: "2026001",
  birth_date: "2010-01-15",
};

describe("studentPortalSignupSchema", () => {
  it("menerima pendaftaran mandiri hanya dengan persetujuan eksplisit", () => {
    expect(studentPortalSignupSchema.safeParse(valid).success).toBe(true);
    expect(studentPortalSignupSchema.safeParse({ ...valid, self_registration_consent: "" }).success).toBe(false);
  });
  it("menerima pendaftaran menggunakan token undangan tanpa persetujuan mandiri", () => {
    expect(studentPortalSignupSchema.safeParse({
      ...valid, invitation_token: "a".repeat(64), self_registration_consent: "", nis: "", birth_date: "",
    }).success).toBe(true);
  });
  it("menolak token undangan dengan format salah", () => {
    expect(studentPortalSignupSchema.safeParse({ ...valid, invitation_token: "token" }).success).toBe(false);
  });
  it("mewajibkan NIS dan tanggal lahir untuk pendaftaran mandiri", () => {
    expect(studentPortalSignupSchema.safeParse({ ...valid, nis: "" }).success).toBe(false);
    expect(studentPortalSignupSchema.safeParse({ ...valid, birth_date: "2010-02-30" }).success).toBe(false);
  });
  it("menolak password terlalu pendek dan email tidak valid", () => {
    expect(studentPortalSignupSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
    expect(studentPortalSignupSchema.safeParse({ ...valid, email: "bukan-email" }).success).toBe(false);
  });
});
