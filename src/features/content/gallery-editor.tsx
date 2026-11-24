import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { DeleteGalleryImageForm } from "./delete-gallery-image-form";
import { saveGallery } from "./gallery-actions";
import { publicMediaUrl } from "@/lib/storage/media-url";

export type GalleryEditorImage = {
  id: string;
  image_path: string;
  alt_text: string | null;
  caption: string | null;
};

export type GalleryEditorValues = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
  sort_order?: number;
  gallery_images?: GalleryEditorImage[];
};

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

export function GalleryEditor({
  initial = {},
  canPublish,
}: {
  initial?: GalleryEditorValues;
  canPublish: boolean;
}) {
  return (
    <form action={saveGallery} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardContent className="grid gap-5">
          <Field id="title" label="Nama album" required>
            <Input id="title" name="title" required minLength={3} maxLength={160} defaultValue={initial.title ?? ""} />
          </Field>
          <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung.">
            <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} defaultValue={initial.slug ?? ""} />
          </Field>
          <Field id="description" label="Deskripsi" hint="Maksimal 5.000 karakter.">
            <Textarea id="description" name="description" rows={5} maxLength={5000} defaultValue={initial.description ?? ""} />
          </Field>
          <Field id="sort_order" label="Urutan tampil" hint="Angka lebih kecil ditampilkan lebih dahulu.">
            <Input id="sort_order" name="sort_order" type="number" step={1} defaultValue={initial.sort_order ?? 0} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="status" label="Status publikasi">
            <Select id="status" name="status" defaultValue={initial.status ?? "draft"}>
              <option value="draft">Draft</option>
              {canPublish && <option value="published">Terbitkan / Jadwalkan</option>}
              <option value="archived">Arsip</option>
            </Select>
          </Field>
          <Field id="published_at" label="Waktu publikasi" hint="Asia/Jakarta. Kosongkan untuk menerbitkan sekarang.">
            <Input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocalDateTime(initial.published_at)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4">
          <div>
            <h2 className="font-semibold">Foto album</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pilih maksimal 20 foto per penyimpanan. JPEG, PNG, WebP, atau AVIF; maksimal 3 MB per foto.</p>
          </div>
          <Field id="images" label="Tambah foto">
            <Input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple />
          </Field>
          {initial.gallery_images?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {initial.gallery_images.map((photo) => {
                const src = publicMediaUrl(photo.image_path);
                return (
                  <div key={photo.id} className="overflow-hidden rounded-lg border border-border">
                    {src && <div className="relative aspect-[4/3] bg-muted"><Image src={src} alt={photo.alt_text ?? "Foto album"} fill unoptimized className="object-cover" /></div>}
                    <div className="p-3"><p className="mb-2 truncate text-xs text-muted-foreground">{photo.alt_text ?? photo.image_path}</p><DeleteGalleryImageForm id={photo.id} /></div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada foto pada album ini.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan album</Button>
        <Link href="/admin/galeri" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
