"use client";

import { useState } from "react";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const TARGET_BYTES = 2.7 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const MAX_PIXELS = 40_000_000;

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Browser gagal memproses gambar."));
    }, type, quality);
  });
}

async function compressImage(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Foto sumber terlalu besar (maksimal 25 MB).");
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MAX_PIXELS) {
      throw new Error("Resolusi foto terlalu besar untuk diproses dengan aman.");
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak menyediakan pemroses gambar.");

    let output: Blob | null = null;
    let outputType = "image/webp";
    for (let resize = 0; resize < 4; resize += 1) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.84, 0.76, 0.68, 0.60]) {
        output = await canvasBlob(canvas, "image/webp", quality);
        outputType = output.type;
        if (output.type !== "image/webp") {
          output = await canvasBlob(canvas, "image/jpeg", quality);
          outputType = output.type;
        }
        if (output.size <= TARGET_BYTES) break;
      }
      if (output && output.size <= TARGET_BYTES) break;
      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    canvas.width = 0;
    canvas.height = 0;
    if (!output || output.size > 3 * 1024 * 1024) {
      throw new Error("Foto belum bisa diperkecil hingga batas 3 MB. Coba foto lain.");
    }

    const extension = outputType === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\\.[^.]+$/, "").slice(0, 80) || "foto-prestasi";
    return new File([output], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export function CompressedImageInput({ name }: { name: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const original = input.files?.[0];
    if (!original) {
      setStatus("");
      return;
    }

    setBusy(true);
    setStatus("Mengoptimalkan foto di perangkat…");
    try {
      const compressed = await compressImage(original);
      const transfer = new DataTransfer();
      transfer.items.add(compressed);
      input.files = transfer.files;
      const before = (original.size / 1024 / 1024).toFixed(2);
      const after = (compressed.size / 1024 / 1024).toFixed(2);
      setStatus(`Siap diunggah: ${before} MB → ${after} MB (${compressed.type}).`);
    } catch (error) {
      input.value = "";
      setStatus(error instanceof Error ? error.message : "Gagal memproses foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        onChange={handleChange}
        aria-describedby={`${name}-compression-status`}
        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
      />
      <p id={`${name}-compression-status`} aria-live="polite" className="text-xs text-muted-foreground">
        {status || "Foto akan diperkecil otomatis di perangkat sebelum dikirim. Maksimal foto sumber 25 MB; hasil akhir maksimal 3 MB."}
      </p>
    </div>
  );
}
