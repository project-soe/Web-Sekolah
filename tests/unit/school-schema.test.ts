import { describe, expect, it } from "vitest";
import { schoolIdentitySchema } from "@/features/school/schema";

const base = { name: "SMK Contoh" };
const empty = {
  slogan: "",
  npsn: "",
  nss: "",
  ownership: "",
  education_level: "",
  accreditation: "",
  founded_year: "",
  headmaster_name: "",
  address: "",
  kecamatan: "",
  kabupaten_kota: "",
  provinsi: "",
  postal_code: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
};

describe("schoolIdentitySchema", () => {
  it("mengubah isian kosong menjadi null", () => {
    const r = schoolIdentitySchema.parse({ ...base, ...empty });
    expect(r.npsn).toBeNull();
    expect(r.ownership).toBeNull();
    expect(r.founded_year).toBeNull();
  });
  it("menerima data valid dan mengubah tahun menjadi angka", () => {
    const r = schoolIdentitySchema.parse({
      ...base,
      ...empty,
      npsn: "12345678",
      founded_year: "1998",
      ownership: "negeri",
      email: "info@sekolah.sch.id",
      website: "https://sekolah.sch.id",
      postal_code: "40111",
    });
    expect(r.founded_year).toBe(1998);
    expect(r.ownership).toBe("negeri");
  });
  it("menolak NPSN, email, website, dan kode pos yang tidak valid", () => {
    for (const bad of [
      { npsn: "123" },
      { email: "salah" },
      { website: "ftp://x" },
      { postal_code: "12" },
    ]) {
      expect(schoolIdentitySchema.safeParse({ ...base, ...empty, ...bad }).success).toBe(false);
    }
  });
  it("menolak nama kosong dan status di luar daftar", () => {
    expect(schoolIdentitySchema.safeParse({ ...empty, name: "" }).success).toBe(false);
    expect(
      schoolIdentitySchema.safeParse({ ...base, ...empty, ownership: "lainnya" }).success,
    ).toBe(false);
  });
});
