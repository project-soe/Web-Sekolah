import { describe, expect, it } from "vitest";
import { galleryInputSchema } from "@/features/content/gallery-schema";

const valid = {
  title: "Kegiatan Sekolah",
  slug: "kegiatan-sekolah",
  description: "Dokumentasi kegiatan sekolah",
  status: "draft",
  published_at: "",
  sort_order: "0",
};

describe("galleryInputSchema", () => {
  it("accepts a valid draft album", () => {
    expect(galleryInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid slug", () => {
    expect(galleryInputSchema.safeParse({ ...valid, slug: "Kegiatan Sekolah" }).success).toBe(false);
  });

  it("rejects titles outside database length limits", () => {
    expect(galleryInputSchema.safeParse({ ...valid, title: "ab" }).success).toBe(false);
  });

  it("rejects invalid publication status", () => {
    expect(galleryInputSchema.safeParse({ ...valid, status: "live" }).success).toBe(false);
  });

  it("coerces sort order to an integer", () => {
    expect(galleryInputSchema.parse(valid).sort_order).toBe(0);
  });
});
