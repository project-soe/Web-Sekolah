import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { saveStudent } from "./student-actions";

export type StudentEditorValues = {
  id?: string; nis?: string; nisn?: string | null; full_name?: string; gender?: "male" | "female";
  birth_place?: string | null; birth_date?: string | null; address?: string | null;
  guardian_name?: string | null; guardian_phone?: string | null; department_id?: string | null;
  enrollment_year?: number; notes?: string | null;
};
type Department = { id: string; name: string };

export function StudentEditor({ initial = {}, departments }: { initial?: StudentEditorValues; departments: Department[] }) {
  return <form action={saveStudent} className="flex max-w-4xl flex-col gap-6">
    {initial.id && <input type="hidden" name="id" value={initial.id} />}
    <Card><CardContent className="grid gap-5 sm:grid-cols-2">
      <Field id="nis" label="NIS" required><Input id="nis" name="nis" required maxLength={30} defaultValue={initial.nis ?? ""} /></Field>
      <Field id="nisn" label="NISN" hint="Opsional, 10 digit."><Input id="nisn" name="nisn" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} defaultValue={initial.nisn ?? ""} /></Field>
      <Field id="full_name" label="Nama lengkap" required><Input id="full_name" name="full_name" required minLength={2} maxLength={150} defaultValue={initial.full_name ?? ""} /></Field>
      <Field id="gender" label="Jenis kelamin" required><Select id="gender" name="gender" required defaultValue={initial.gender ?? ""}><option value="" disabled>Pilih jenis kelamin</option><option value="male">Laki-laki</option><option value="female">Perempuan</option></Select></Field>
      <Field id="birth_place" label="Tempat lahir"><Input id="birth_place" name="birth_place" maxLength={100} defaultValue={initial.birth_place ?? ""} /></Field>
      <Field id="birth_date" label="Tanggal lahir"><Input id="birth_date" name="birth_date" type="date" defaultValue={initial.birth_date ?? ""} /></Field>
      <Field id="enrollment_year" label="Tahun masuk" required><Input id="enrollment_year" name="enrollment_year" type="number" min={2000} max={2200} required defaultValue={initial.enrollment_year ?? new Date().getFullYear()} /></Field>
      <Field id="department_id" label="Jurusan"><Select id="department_id" name="department_id" defaultValue={initial.department_id ?? ""}><option value="">Belum ditentukan</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
    </CardContent></Card>
    <Card><CardContent className="grid gap-5 sm:grid-cols-2">
      <Field id="guardian_name" label="Nama orang tua / wali"><Input id="guardian_name" name="guardian_name" maxLength={150} defaultValue={initial.guardian_name ?? ""} /></Field>
      <Field id="guardian_phone" label="Nomor telepon wali"><Input id="guardian_phone" name="guardian_phone" type="tel" maxLength={30} defaultValue={initial.guardian_phone ?? ""} /></Field>
      <div className="sm:col-span-2"><Field id="address" label="Alamat"><Textarea id="address" name="address" rows={3} maxLength={1000} defaultValue={initial.address ?? ""} /></Field></div>
    </CardContent></Card>
    <Card><CardContent className="grid gap-5">
      <div><Field id="notes" label="Catatan internal"><Textarea id="notes" name="notes" rows={3} maxLength={2000} defaultValue={initial.notes ?? ""} /></Field></div>
      <p className="text-xs text-muted-foreground">Status dan tanggal kelulusan dikelola melalui proses akademik khusus agar riwayat siswa tetap konsisten.</p>
    </CardContent></Card>
    <div className="flex flex-wrap gap-3"><Button type="submit" size="lg">Simpan data siswa</Button><Link href={initial.id ? "/admin/siswa/" + initial.id : "/admin/siswa"} className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-medium hover:bg-muted">Batal</Link></div>
  </form>;
}
