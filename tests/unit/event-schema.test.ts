import { describe, expect, it } from "vitest";
import { eventInputSchema } from "@/features/content/event-schema";

const valid = {
  title: "Rapat Wali Murid Semester Ganjil",
  slug: "rapat-wali-murid-semester-ganjil",
  summary: "Pertemuan wali murid.",
  description: "Rapat koordinasi wali murid dan pihak sekolah.",
  location: "Aula sekolah",
  starts_at: "2026-12-10T08:00",
  ends_at: "2026-12-10T10:00",
  registration_url: "https://example.com/daftar",
  status: "draft",
  published_at: "",
  sort_order: "0",
};

describe("eventInputSchema", () => {
  it("accepts a valid event", () => {
    expect(eventInputSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects an invalid slug", () => {
    expect(eventInputSchema.safeParse({ ...valid, slug: "Agenda Sekolah" }).success).toBe(false);
  });
  it("rejects an insecure registration URL", () => {
    expect(eventInputSchema.safeParse({ ...valid, registration_url: "http://example.com" }).success).toBe(false);
  });
  it("rejects an empty description", () => {
    expect(eventInputSchema.safeParse({ ...valid, description: " " }).success).toBe(false);
  });
  it("coerces sort order to an integer", () => {
    expect(eventInputSchema.parse({ ...valid, sort_order: "12" }).sort_order).toBe(12);
  });
});
