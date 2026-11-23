export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Mengecilkan gambar dan mengubahnya ke WebP di browser. Hanya untuk kenyamanan dan penghematan kuota;
 * validasi yang menentukan tetap dilakukan server. Jika gagal, file asli dikembalikan.
 */
export async function compressImage(file: File, maxDim: number, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob || blob.type !== "image/webp") return file;
    return new File([blob], "gambar.webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
