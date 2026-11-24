import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { publicMediaUrl } from "@/lib/storage/media-url";
import { CompressedImageInput } from "./compressed-image-input";
import { saveDepartment } from "./department-actions";

export type DepartmentEditorValues = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image_path?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export function DepartmentEditor({ initial = {}, canPublish }: {
  initial?: DepartmentEditorValues;
  canPublish: boolean;
}) {
  const imageUrl = publicMediaUrl(initial.image_path);
  return (
    <form action={saveDepartment} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card><CardContent className="grid gap-5">
        <Field id="name" label="Nama jurusan / program keahlian" required>
          <Input id="name" name="name" required minLength={2} maxLength={150} defaultValue={initial.name ?? ""} />
        </Field>
        <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung.">
          <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} defaultValue={initial.slug ?? ""} />
        </Field>
        <Field id="description" label="Deskripsi jurusan">
          <Textarea id="description" name="description" rows={8} maxLength={5000} defaultValue={initial.description ?? ""} />
        </Field>
        <Field id="sort_order" label="Urutan tampil" hint="Angka lebih kecil ditampilkan lebih dahulu.">
          <Input id="sort_order" name="sort_order" type="number" step={1} defaultValue={initial.sort_order ?? 0} />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-5">
        <div><h2 className="font-semibold">Gambar jurusan</h2>
          <p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, atau AVIF. Gambar dikompresi otomatis; hasil akhir maksimal 3 MB.</p></div>
        {imageUrl && <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg bg-muted">
          <Image src={imageUrl} alt={initial.name ?? "Gambar jurusan"} fill unoptimized className="object-cover" />
        </div>}
        <Field id="image" label="Pilih gambar">
          <CompressedImageInput name="image" />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={initial.is_published ?? false}
            disabled={!canPublish} className="mt-1 size-4 accent-primary" />
          <span><span className="font-medium">Tampilkan pada website publik</span>
            <span className="mt-1 block text-muted-foreground">
              {canPublish ? "Jurusan hanya tampil setelah opsi ini diaktifkan." : "Anda tidak memiliki permission publikasi; status tampil tidak dapat diubah."}
            </span>
          </span>
        </label>
      </CardContent></Card>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan jurusan</Button>
        <Link href="/admin/jurusan" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
