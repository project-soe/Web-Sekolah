import { describe, expect, it } from "vitest";
import { studentInputSchema } from "@/features/students/student-schema";

const validStudent = {
  nis: "2026001", nisn: "0123456789", full_name: "Siswa Contoh", gender: "male",
  birth_place: "Palembang", birth_date: "2010-01-15", address: "Alamat contoh",
  guardian_name: "Orang Tua", guardian_phone: "+628123456789", department_id: "",
  enrollment_year: "2026", status: "active", graduation_date: "", notes: "",
};

describe("studentInputSchema", () => {
  it("menerima data siswa valid dengan jurusan opsional", () => expect(studentInputSchema.safeParse(validStudent).success).toBe(true));
  it("menolak NISN yang bukan 10 digit", () => expect(studentInputSchema.safeParse({ ...validStudent, nisn: "12345" }).success).toBe(false));
  it("menolak nama terlalu pendek dan NIS kosong", () => {
    expect(studentInputSchema.safeParse({ ...validStudent, full_name: "A" }).success).toBe(false);
    expect(studentInputSchema.safeParse({ ...validStudent, nis: " " }).success).toBe(false);
  });
  it("menolak tanggal kalender yang tidak valid", () => expect(studentInputSchema.safeParse({ ...validStudent, birth_date: "2026-02-30" }).success).toBe(false));
  it("mengabaikan field status dan tanggal lulus di luar schema data induk", () => {
    const result = studentInputSchema.safeParse({
      ...validStudent,
      status: "graduated",
      graduation_date: "2009-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("status");
      expect(result.data).not.toHaveProperty("graduation_date");
    }
  });
  it("menerima UUID saat edit", () => expect(studentInputSchema.safeParse({ ...validStudent, id: "00000000-0000-4000-8000-000000000000" }).success).toBe(true));
});
