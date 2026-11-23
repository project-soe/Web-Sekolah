import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveNews } from "./news-actions";

export type NewsEditorValues = {
  id?: string;
  title?: string;
  slug?: string;
  category_id?: string | null;
  excerpt?: string | null;
  content?: string;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
};

type Category = { id: string; name: string };

function toLocalDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
  return parts.replace(" ", "T");
}

export function NewsEditor({
  initial = {},
  categories,
  canPublish,
}: {
  initial?: NewsEditorValues;
  categories: Category[];
  canPublish: boolean;
}) {
  return (
    <form action={saveNews} className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardContent className="grid gap-5">
          <Field id="title" label="Judul berita" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} defaultValue={initial.title ?? ""} />
          </Field>
          <Field id="slug" label="Slug URL" hint="Gunakan huruf kecil, angka, dan tanda hubung. Contoh: siswa-raih-juara">
            <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} defaultValue={initial.slug ?? ""} />
          </Field>
          <Field id="category_id" label="Kategori">
            <Select id="category_id" name="category_id" defaultValue={initial.category_id ?? ""}>
              <option value="">Tanpa kategori</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </Select>
          </Field>
          <Field id="excerpt" label="Ringkasan" hint="Maksimal 500 karakter.">
            <Textarea id="excerpt" name="excerpt" rows={3} maxLength={500} defaultValue={initial.excerpt ?? ""} />
          </Field>
          <Field id="content" label="Isi berita" required hint="Teks biasa dengan pemisah paragraf.">
            <Textarea id="content" name="content" rows={16} required maxLength={50000} defaultValue={initial.content ?? ""} />
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
          <Field id="published_at" label="Waktu publikasi" hint="Zona waktu Asia/Jakarta. Kosongkan untuk menerbitkan sekarang.">
            <Input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocalDateTime(initial.published_at)} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan berita</Button>
        <Link href="/admin/berita" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
