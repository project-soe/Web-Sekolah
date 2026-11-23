import { BUCKETS, type BucketKey } from "./buckets";

type Detected = { mime: string; ext: string };

const ascii = (b: Uint8Array, start: number, text: string) =>
  text.split("").every((c, i) => b[start + i] === c.charCodeAt(0));

/** Mengenali tipe file dari byte awalnya, bukan dari nama atau header dari browser. */
export function detectFileType(b: Uint8Array): Detected | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v))
    return { mime: "image/png", ext: "png" };
  if (b.length >= 12 && ascii(b, 0, "RIFF") && ascii(b, 8, "WEBP"))
    return { mime: "image/webp", ext: "webp" };
  if (b.length >= 12 && ascii(b, 4, "ftyp") && (ascii(b, 8, "avif") || ascii(b, 8, "avis")))
    return { mime: "image/avif", ext: "avif" };
  if (b.length >= 5 && ascii(b, 0, "%PDF-")) return { mime: "application/pdf", ext: "pdf" };
  return null;
}

export type UploadCheck = { ok: true; mime: string; ext: string } | { ok: false; error: string };

export function validateUpload(
  bucket: BucketKey,
  file: { size: number; declaredMime: string; head: Uint8Array },
): UploadCheck {
  const rule = BUCKETS[bucket];
  if (file.size <= 0) return { ok: false, error: "File kosong." };
  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      error: `Ukuran file melebihi ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
    };
  }
  const detected = detectFileType(file.head);
  if (!detected) return { ok: false, error: "Tipe file tidak dikenali." };
  if (!(rule.mimes as readonly string[]).includes(detected.mime)) {
    return { ok: false, error: "Tipe file tidak diizinkan untuk lokasi ini." };
  }
  if (file.declaredMime !== detected.mime) {
    return { ok: false, error: "Isi file tidak sesuai dengan tipe yang dinyatakan." };
  }
  return { ok: true, mime: detected.mime, ext: detected.ext };
}

/** Nama file acak; nama asli dari pengguna tidak pernah dipakai sebagai path. */
export function randomObjectPath(folder: string, ext: string) {
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}
