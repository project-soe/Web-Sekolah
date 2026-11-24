import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { publicMediaUrl } from "@/lib/storage/media-url";
import { CompressedImageInput } from "./compressed-image-input";
import { saveTeacher } from "./teacher-actions";

export type TeacherEditorValues = {
  id?: string;
  full_name?: string;
  slug?: string;
  employee_number?: string | null;
  position?: string | null;
  department_id?: string | null;
  education?: string | null;
  biography?: string | null;
  email?: string | null;
  photo_path?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export type TeacherDepartmentOption = { id: string; name: string };

export function TeacherEditor({
  initial = {},
  departments,
  canPublish,
}: {
  initial?: TeacherEditorValues;
  departments: TeacherDepartmentOption[];
  canPublish: boolean;
}) {
  const photoUrl = publicMediaUrl(initial.photo_path);
  return (
    <form action={saveTeacher} encType="multipart/form-data" className="flex max-w-4xl flex-col gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Card><CardContent className="grid gap-5">
        <Field id="full_name" label="Nama lengkap" required>
          <Input id="full_name" name="full_name" required minLength={2} maxLength={150} defaultValue={initial.full_name ?? ""} />
        </Field>
        <Field id="slug" label="Slug URL" hint="Huruf kecil, angka, dan tanda hubung.">
          <Input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} defaultValue={initial.slug ?? ""} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="employee_number" label="NIP / Nomor pegawai">
            <Input id="employee_number" name="employee_number" maxLength={40} defaultValue={initial.employee_number ?? ""} />
          </Field>
          <Field id="position" label="Jabatan">
            <Input id="position" name="position" maxLength={120} defaultValue={initial.position ?? ""} placeholder="Guru, Kepala Sekolah, Staf..." />
          </Field>
        </div>
        <Field id="department_id" label="Jurusan / Unit">
          <Select id="department_id" name="department_id" defaultValue={initial.department_id ?? ""}>
            <option value="">Tidak ditentukan</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </Select>
        </Field>
        <Field id="education" label="Pendidikan terakhir">
          <Input id="education" name="education" maxLength={200} defaultValue={initial.education ?? ""} />
        </Field>
        <Field id="email" label="Email dinas" hint="Tidak ditampilkan pada halaman publik.">
          <Input id="email" name="email" type="email" maxLength={254} defaultValue={initial.email ?? ""} />
        </Field>
        <Field id="biography" label="Biografi singkat">
          <Textarea id="biography" name="biography" rows={7} maxLength={5000} defaultValue={initial.biography ?? ""} />
        </Field>
        <Field id="sort_order" label="Urutan tampil" hint="Angka lebih kecil ditampilkan lebih dahulu.">
          <Input id="sort_order" name="sort_order" type="number" step={1} defaultValue={initial.sort_order ?? 0} />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-5">
        <div>
          <h2 className="font-semibold">Foto profil</h2>
          <p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, atau AVIF. Foto akan dikompresi otomatis; hasil akhir maksimal 3 MB.</p>
        </div>
        {photoUrl && <div className="relative aspect-[4/3] max-w-sm overflow-hidden rounded-lg bg-muted">
          <Image src={photoUrl} alt={initial.full_name ?? "Foto guru"} fill unoptimized className="object-cover" />
        </div>}
        <Field id="photo" label="Pilih foto">
          <CompressedImageInput name="photo" />
        </Field>
      </CardContent></Card>
      <Card><CardContent className="grid gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial.is_published ?? false}
            disabled={!canPublish && Boolean(initial.is_published)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            <span className="font-medium">Tampilkan pada website publik</span>
            <span className="mt-1 block text-muted-foreground">
              {canPublish ? "Data guru hanya tampil setelah opsi ini diaktifkan." : "Anda tidak memiliki permission publikasi; status data terbit tidak dapat diubah."}
            </span>
          </span>
        </label>
      </CardContent></Card>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">Simpan data guru</Button>
        <Link href="/admin/guru" className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link>
      </div>
    </form>
  );
}
