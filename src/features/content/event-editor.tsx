import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { publicMediaUrl } from "@/lib/storage/media-url";
import { CompressedImageInput } from "./compressed-image-input";
import { saveEvent } from "./event-actions";

export type EventEditorValues = {
  id?: string; title?: string; slug?: string; summary?: string | null;
  description?: string; location?: string | null; starts_at?: string;
  ends_at?: string | null; image_path?: string | null; registration_url?: string | null;
  status?: "draft" | "published" | "archived"; published_at?: string | null; sort_order?: number;
};

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

export function EventEditor({ initial = {}, canPublish }: {
  initial?: EventEditorValues; canPublish: boolean;
}) {
  const imageUrl = publicMediaUrl(initial.image_path);
  return (
    <form action={saveEvent} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card><CardContent className="grid gap-5">
        <Field id="title" label="Nama kegiatan" required>
          <Input id="title" name="title" required minLength={3} maxLength={180} defaultValue={initial.title ?? ""} />
        </Field>
        <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung.">
          <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} defaultValue={initial.slug ?? ""} />
        </Field>
        <Field id="summary" label="Ringkasan" hint="Maksimal 500 karakter.">
          <Textarea id="summary" name="summary" rows={3} maxLength={500} defaultValue={initial.summary ?? ""} />
        </Field>
        <Field id="description" label="Deskripsi kegiatan" required>
          <Textarea id="description" name="description" rows={10} required maxLength={20000} defaultValue={initial.description ?? ""} />
        </Field>
        <Field id="location" label="Lokasi kegiatan">
          <Input id="location" name="location" maxLength={240} defaultValue={initial.location ?? ""} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="starts_at" label="Waktu mulai" required hint="Zona waktu Asia/Jakarta.">
            <Input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={toLocalDateTime(initial.starts_at)} />
          </Field>
          <Field id="ends_at" label="Waktu selesai" hint="Opsional, harus setelah waktu mulai.">
            <Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toLocalDateTime(initial.ends_at)} />
          </Field>
        </div>
        <Field id="registration_url" label="URL pendaftaran / informasi" hint="Opsional, wajib HTTPS.">
          <Input id="registration_url" name="registration_url" type="url" placeholder="https://..." defaultValue={initial.registration_url ?? ""} />
        </Field>
        <Field id="sort_order" label="Urutan tampil" hint="Angka lebih kecil ditampilkan lebih dahulu.">
          <Input id="sort_order" name="sort_order" type="number" step={1} defaultValue={initial.sort_order ?? 0} />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-5 sm:grid-cols-2">
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
      </CardContent></Card>
      <Card><CardContent className="grid gap-4">
        <div><h2 className="font-semibold">Gambar agenda</h2><p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, atau AVIF; maksimal 3 MB setelah kompresi.</p></div>
        {imageUrl && <div className="relative aspect-video max-w-xl overflow-hidden rounded-lg bg-muted"><Image src={imageUrl} alt={initial.title ?? "Gambar agenda"} fill unoptimized className="object-cover" /></div>}
        <Field id="image" label="Pilih gambar"><CompressedImageInput name="image" /></Field>
      </CardContent></Card>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan agenda</Button>
        <Link href="/admin/agenda" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
