import { describe, expect, it } from "vitest";
import { announcementInputSchema } from "@/features/content/announcement-schema";

const validAnnouncement = {
  title: "Pemberitahuan Libur Sekolah",
  slug: "pemberitahuan-libur-sekolah",
  summary: "",
  content: "Informasi resmi dari sekolah.",
  attachment_path: "",
  status: "draft",
  published_at: "",
  expires_at: "",
};

describe("announcementInputSchema", () => {
  it("menerima draft tanpa jadwal dan lampiran", () => {
    expect(announcementInputSchema.safeParse(validAnnouncement).success).toBe(true);
  });

  it("menolak slug yang tidak aman", () => {
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, slug: "Libur Sekolah" }).success).toBe(false);
  });

  it("menolak judul dan isi terlalu pendek", () => {
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, title: "abc" }).success).toBe(false);
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, content: " " }).success).toBe(false);
  });

  it("menolak status yang tidak dikenal", () => {
    expect(announcementInputSchema.safeParse({ ...validAnnouncement, status: "live" }).success).toBe(false);
  });

  it("menerima UUID untuk proses edit", () => {
    expect(announcementInputSchema.safeParse({
      ...validAnnouncement,
      id: "00000000-0000-4000-8000-000000000000",
    }).success).toBe(true);
  });
});
