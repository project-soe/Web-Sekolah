import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { saveAnnouncement } from "./announcement-actions";

export type AnnouncementEditorValues = {
  id?: string;
  title?: string;
  slug?: string;
  summary?: string | null;
  content?: string;
  attachment_path?: string | null;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
  expires_at?: string | null;
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

export function AnnouncementEditor({
  initial = {},
  canPublish,
}: {
  initial?: AnnouncementEditorValues;
  canPublish: boolean;
}) {
  return (
    <form action={saveAnnouncement} className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card>
        <CardContent className="grid gap-5">
          <Field id="title" label="Judul pengumuman" required>
            <Input id="title" name="title" required minLength={5} maxLength={200} defaultValue={initial.title ?? ""} />
          </Field>
          <Field id="slug" label="Slug URL" hint="Gunakan huruf kecil, angka, dan tanda hubung.">
            <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} defaultValue={initial.slug ?? ""} />
          </Field>
          <Field id="summary" label="Ringkasan" hint="Maksimal 500 karakter.">
            <Textarea id="summary" name="summary" rows={3} maxLength={500} defaultValue={initial.summary ?? ""} />
          </Field>
          <Field id="content" label="Isi pengumuman" required>
            <Textarea id="content" name="content" rows={14} required maxLength={30000} defaultValue={initial.content ?? ""} />
          </Field>
          <Field id="attachment_path" label="Lokasi berkas lampiran (opsional)" hint="Isi path objek Storage yang sudah diunggah. Fitur unggah langsung belum termasuk tahap ini.">
            <Input id="attachment_path" name="attachment_path" maxLength={1000} defaultValue={initial.attachment_path ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="status" label="Status publikasi">
            <select id="status" name="status" defaultValue={initial.status ?? "draft"} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="draft">Draft</option>
              {canPublish && <option value="published">Terbitkan / Jadwalkan</option>}
              <option value="archived">Arsip</option>
            </select>
          </Field>
          <Field id="published_at" label="Waktu publikasi" hint="Asia/Jakarta. Kosongkan untuk menerbitkan sekarang.">
            <Input id="published_at" name="published_at" type="datetime-local" defaultValue={toLocalDateTime(initial.published_at)} />
          </Field>
          <Field id="expires_at" label="Masa berlaku sampai" hint="Kosongkan jika tidak memiliki tanggal kedaluwarsa.">
            <Input id="expires_at" name="expires_at" type="datetime-local" defaultValue={toLocalDateTime(initial.expires_at)} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan pengumuman</Button>
        <Link href="/admin/pengumuman" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
