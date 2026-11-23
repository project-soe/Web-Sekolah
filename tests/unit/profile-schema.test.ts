import { describe, expect, it } from "vitest";
import { profileSchema } from "@/features/school/profile-schema";

const empty = { headmaster_message: "", vision: "", mission: "", history: "", objectives: "" };

describe("profileSchema", () => {
  it("mengubah isian kosong menjadi null", () => {
    const r = profileSchema.parse(empty);
    expect(r.vision).toBeNull();
    expect(r.history).toBeNull();
  });
  it("menormalkan baris baru CRLF menjadi LF dan memangkas spasi", () => {
    const r = profileSchema.parse({ ...empty, mission: "  satu\r\ndua\r\n  " });
    expect(r.mission).toBe("satu\ndua");
  });
  it("menolak teks melebihi batas database", () => {
    expect(profileSchema.safeParse({ ...empty, vision: "x".repeat(2001) }).success).toBe(false);
    expect(profileSchema.safeParse({ ...empty, vision: "x".repeat(2000) }).success).toBe(true);
  });
});
