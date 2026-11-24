import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { publicMediaUrl } from "@/lib/storage/media-url";
import { CompressedImageInput } from "./compressed-image-input";
import { saveFacility } from "./facility-actions";

export type FacilityEditorValues = {
  id?: string; name?: string; slug?: string; facility_type?: string;
  description?: string | null; location?: string | null; capacity?: number | null;
  image_path?: string | null; sort_order?: number; is_published?: boolean;
};
const types = [
  ["gedung","Gedung"],["ruang","Ruang"],["laboratorium","Laboratorium"],
  ["olahraga","Olahraga"],["ibadah","Tempat ibadah"],["lainnya","Lainnya"],
];

export function FacilityEditor({ initial = {}, canPublish }: { initial?: FacilityEditorValues; canPublish: boolean }) {
  const imageUrl = publicMediaUrl(initial.image_path);
  return <form action={saveFacility} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
    {initial.id && <input type="hidden" name="id" value={initial.id} />}
    <Card><CardContent className="grid gap-5">
      <Field id="name" label="Nama fasilitas" required><Input id="name" name="name" required minLength={2} maxLength={150} defaultValue={initial.name ?? ""} /></Field>
      <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung."><Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={160} defaultValue={initial.slug ?? ""} /></Field>
      <Field id="facility_type" label="Jenis fasilitas" required>
        <select id="facility_type" name="facility_type" defaultValue={initial.facility_type ?? "ruang"} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
          {types.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field id="location" label="Lokasi" hint="Contoh: Gedung A lantai 2"><Input id="location" name="location" maxLength={200} defaultValue={initial.location ?? ""} /></Field>
      <Field id="capacity" label="Kapasitas" hint="Kosongkan jika tidak relevan."><Input id="capacity" name="capacity" type="number" min={1} max={100000} step={1} defaultValue={initial.capacity ?? ""} /></Field>
      <Field id="description" label="Deskripsi"><Textarea id="description" name="description" rows={7} maxLength={5000} defaultValue={initial.description ?? ""} /></Field>
      <Field id="sort_order" label="Urutan tampil"><Input id="sort_order" name="sort_order" type="number" step={1} defaultValue={initial.sort_order ?? 0} /></Field>
    </CardContent></Card>
    <Card><CardContent className="grid gap-5">
      <div><h2 className="font-semibold">Foto fasilitas</h2><p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, atau AVIF. Foto dikompresi otomatis; hasil akhir maksimal 3 MB.</p></div>
      {imageUrl && <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg bg-muted"><Image src={imageUrl} alt={initial.name ?? "Foto fasilitas"} fill unoptimized className="object-cover" /></div>}
      <Field id="image" label="Pilih foto"><CompressedImageInput name="image" /></Field>
    </CardContent></Card>
    <Card><CardContent><label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name="is_published" defaultChecked={initial.is_published ?? false} disabled={!canPublish} className="mt-1 size-4 accent-primary" />
      <span><span className="font-medium">Tampilkan pada website publik</span><span className="mt-1 block text-muted-foreground">{canPublish ? "Fasilitas hanya tampil setelah dipublikasikan." : "Anda tidak memiliki permission publikasi."}</span></span>
    </label></CardContent></Card>
    <div className="flex flex-wrap gap-3"><Button type="submit" size="lg">Simpan fasilitas</Button><Link href="/admin/fasilitas" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link></div>
  </form>;
}
