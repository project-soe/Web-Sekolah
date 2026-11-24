import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveAchievement } from "./achievement-actions";
import { publicMediaUrl } from "@/lib/storage/media-url";

export type AchievementEditorValues = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  recipient?: string | null;
  achievement_level?: "Sekolah" | "Kabupaten/Kota" | "Provinsi" | "Nasional" | "Internasional";
  achievement_date?: string | null;
  image_path?: string | null;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
  sort_order?: number;
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

export function AchievementEditor({ initial = {}, canPublish }: {
  initial?: AchievementEditorValues;
  canPublish: boolean;
}) {
  const imageUrl = publicMediaUrl(initial.image_path);
  return (
    <form action={saveAchievement} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card><CardContent className="grid gap-5">
        <Field id="title" label="Nama prestasi" required>
          <Input id="title" name="title" required minLength={3} maxLength={180} defaultValue={initial.title ?? ""} />
        </Field>
        <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung.">
          <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} defaultValue={initial.slug ?? ""} />
        </Field>
        <Field id="recipient" label="Peraih prestasi" hint="Nama siswa, tim, kelas, atau warga sekolah.">
          <Input id="recipient" name="recipient" maxLength={180} defaultValue={initial.recipient ?? ""} />
        </Field>
        <Field id="achievement_level" label="Tingkat prestasi">
          <Select id="achievement_level" name="achievement_level" defaultValue={initial.achievement_level ?? "Sekolah"}>
            {["Sekolah", "Kabupaten/Kota", "Provinsi", "Nasional", "Internasional"].map((level) =>
              <option key={level} value={level}>{level}</option>)}
          </Select>
        </Field>
        <Field id="achievement_date" label="Tanggal pencapaian">
          <Input id="achievement_date" name="achievement_date" type="date" defaultValue={initial.achievement_date ?? ""} />
        </Field>
        <Field id="description" label="Deskripsi prestasi" required>
          <Textarea id="description" name="description" rows={8} required maxLength={10000} defaultValue={initial.description ?? ""} />
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
        <Field id="published_at" label="Waktu publikasi" hint="Zona Asia/Jakarta. Kosongkan untuk menerbitkan sekarang.">
          <Input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocalDateTime(initial.published_at)} />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-4">
        <div><h2 className="font-semibold">Gambar prestasi</h2><p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, atau AVIF; maksimal 3 MB. Unggah gambar baru untuk mengganti gambar lama.</p></div>
        {imageUrl && <div className="relative aspect-video max-w-xl overflow-hidden rounded-lg bg-muted"><Image src={imageUrl} alt={initial.title ?? "Gambar prestasi"} fill unoptimized className="object-cover" /></div>}
        <Field id="image" label="Pilih gambar">
          <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
        </Field>
      </CardContent></Card>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan prestasi</Button>
        <Link href="/admin/prestasi" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
