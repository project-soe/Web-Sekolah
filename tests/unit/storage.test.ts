import { describe, expect, it } from "vitest";
import { detectFileType, validateUpload } from "@/lib/storage/validate";

const bytes = (...v: number[]) => new Uint8Array(v);
const text = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
const pdf = text("%PDF-1.7");
const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0);
const exe = text("MZ\u0090\u0000");

describe("detectFileType", () => {
  it("mengenali pdf, jpeg, dan png dari byte awal", () => {
    expect(detectFileType(pdf)?.mime).toBe("application/pdf");
    expect(detectFileType(jpeg)?.mime).toBe("image/jpeg");
    expect(detectFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe(
      "image/png",
    );
  });
  it("mengenali webp (RIFF....WEBP)", () => {
    const b = new Uint8Array(12);
    b.set(text("RIFF"), 0);
    b.set(text("WEBP"), 8);
    expect(detectFileType(b)?.mime).toBe("image/webp");
  });
  it("menolak file tak dikenal", () => {
    expect(detectFileType(exe)).toBeNull();
  });
});

describe("validateUpload", () => {
  it("menerima pdf untuk dokumen PPDB", () => {
    const r = validateUpload("admissionDocs", {
      size: 1000,
      declaredMime: "application/pdf",
      head: pdf,
    });
    expect(r).toEqual({ ok: true, mime: "application/pdf", ext: "pdf" });
  });
  it("menolak pdf untuk bucket media (hanya gambar)", () => {
    expect(
      validateUpload("media", { size: 1000, declaredMime: "application/pdf", head: pdf }).ok,
    ).toBe(false);
  });
  it("menolak file yang tipenya dipalsukan", () => {
    expect(validateUpload("media", { size: 1000, declaredMime: "image/png", head: jpeg }).ok).toBe(
      false,
    );
  });
  it("menolak file terlalu besar dan file kosong", () => {
    expect(
      validateUpload("admissionDocs", {
        size: 3 * 1024 * 1024,
        declaredMime: "application/pdf",
        head: pdf,
      }).ok,
    ).toBe(false);
    expect(validateUpload("media", { size: 0, declaredMime: "image/jpeg", head: jpeg }).ok).toBe(
      false,
    );
  });
});
