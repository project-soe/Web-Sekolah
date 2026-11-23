import { describe, expect, it } from "vitest";
import { buildPublicUrl } from "@/lib/storage/urls";
import { fitWithin } from "@/utils/image";

describe("buildPublicUrl", () => {
  it("membentuk URL publik dan meng-encode path", () => {
    expect(buildPublicUrl("https://x.supabase.co/", "media", "school/a b.webp")).toBe(
      "https://x.supabase.co/storage/v1/object/public/media/school/a%20b.webp",
    );
  });
});

describe("fitWithin", () => {
  it("memperkecil sisi terpanjang ke batas dengan rasio tetap", () => {
    expect(fitWithin(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 });
  });
  it("tidak memperbesar gambar kecil", () => {
    expect(fitWithin(300, 200, 1000)).toEqual({ width: 300, height: 200 });
  });
});
