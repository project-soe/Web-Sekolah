import { describe, expect, it } from "vitest";
import { newsInputSchema } from "@/features/content/news-schema";

const validNews = {
  title: "Siswa Raih Juara",
  slug: "siswa-raih-juara",
  category_id: "",
  excerpt: "",
  content: "Isi berita lengkap.",
  status: "draft",
  published_at: "",
};

describe("newsInputSchema", () => {
  it("menerima draft dengan kategori dan jadwal kosong", () => {
    const result = newsInputSchema.safeParse(validNews);
    expect(result.success).toBe(true);
  });

  it("menolak slug yang bukan format URL aman", () => {
    expect(newsInputSchema.safeParse({ ...validNews, slug: "Siswa Raih Juara" }).success).toBe(false);
  });

  it("menolak judul dan isi yang terlalu pendek", () => {
    expect(newsInputSchema.safeParse({ ...validNews, title: "abc" }).success).toBe(false);
    expect(newsInputSchema.safeParse({ ...validNews, content: " " }).success).toBe(false);
  });

  it("menolak status publikasi yang tidak dikenal", () => {
    expect(newsInputSchema.safeParse({ ...validNews, status: "live" }).success).toBe(false);
  });

  it("menerima ID UUID untuk proses edit", () => {
    expect(newsInputSchema.safeParse({ ...validNews, id: "00000000-0000-4000-8000-000000000000" }).success).toBe(true);
  });
});
