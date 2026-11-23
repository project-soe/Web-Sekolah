import { describe, expect, it } from "vitest";
import { can, type Access } from "@/lib/rbac/access";
import { loginSchema } from "@/features/auth/schema";

const editor: Access = {
  is_super_admin: false,
  roles: ["editor"],
  permissions: ["news:view", "news:publish"],
};
const superAdmin: Access = { is_super_admin: true, roles: ["super_admin"], permissions: [] };

describe("can", () => {
  it("memeriksa permission dari daftar role", () => {
    expect(can(editor, "news:publish")).toBe(true);
    expect(can(editor, "students:view")).toBe(false);
  });
  it("super admin lolos semua permission", () => {
    expect(can(superAdmin, "apa:saja")).toBe(true);
  });
});

describe("loginSchema", () => {
  it("menolak email tidak valid dan password kosong", () => {
    expect(loginSchema.safeParse({ email: "salah", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.id", password: "" }).success).toBe(false);
  });
  it("menerima input valid", () => {
    expect(loginSchema.safeParse({ email: "a@b.id", password: "x" }).success).toBe(true);
  });
});
