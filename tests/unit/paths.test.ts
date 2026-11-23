import { describe, expect, it } from "vitest";
import { isActivePath } from "@/utils/paths";

describe("isActivePath", () => {
  it("beranda hanya aktif di '/'", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/berita", "/")).toBe(false);
  });
  it("menu aktif untuk halaman turunannya, tapi bukan awalan yang mirip", () => {
    expect(isActivePath("/berita/judul-artikel", "/berita")).toBe(true);
    expect(isActivePath("/beritaku", "/berita")).toBe(false);
  });
  it("dashboard admin tidak aktif di modul lain", () => {
    expect(isActivePath("/admin/guru", "/admin")).toBe(false);
    expect(isActivePath("/admin/guru/tambah", "/admin/guru")).toBe(true);
  });
});
