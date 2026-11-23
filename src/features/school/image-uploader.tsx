"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compressImage } from "@/utils/image";
import { removeSchoolImage, uploadSchoolImage } from "./image-actions";

const MAX_SEND_BYTES = 900 * 1024;

type Props = {
  kind: "logo" | "hero";
  title: string;
  hint: string;
  currentUrl: string | null;
  maxDim: number;
  previewClass: string;
};

export function ImageUploader({ kind, title, hint, currentUrl, maxDim, previewClass }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [pending, startTransition] = useTransition();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    startTransition(async () => {
      const file = await compressImage(picked, maxDim);
      if (file.size > MAX_SEND_BYTES) {
        toast.error("Ukuran gambar terlalu besar. Pilih gambar yang lebih kecil.");
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadSchoolImage(kind, fd);
      if (res.ok) {
        toast.success(`${title} berhasil diperbarui`);
        window.location.reload();
      } else {
        toast.error(res.error ?? "Gagal mengunggah gambar.");
      }
    });
  }

  function onRemove() {
    if (!window.confirm(`Hapus ${title.toLowerCase()}?`)) return;
    startTransition(async () => {
      const res = await removeSchoolImage(kind);
      if (res.ok) {
        setUrl(null);
        toast.success(`${title} dihapus`);
      } else {
        toast.error(res.error ?? "Gagal menghapus gambar.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className={`relative overflow-hidden rounded-lg border border-border bg-muted ${previewClass}`}
        >
          {url ? (
            <Image
              src={url}
              alt={`Pratinjau ${title}`}
              fill
              unoptimized
              className="object-contain"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Belum ada gambar
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            id={`file-${kind}`}
            aria-label={`Pilih berkas ${title}`}
            onChange={onPick}
            disabled={pending}
          />
          <Button type="button" loading={pending} onClick={() => inputRef.current?.click()}>
            {url ? "Ganti gambar" : "Unggah gambar"}
          </Button>
          {url && (
            <Button type="button" variant="outline" disabled={pending} onClick={onRemove}>
              Hapus
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
