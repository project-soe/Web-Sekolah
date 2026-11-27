import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Input, Select } from "@/components/ui/field";
import { requirePermission } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Data Siswa" };
export const dynamic = "force-dynamic";
const labels: Record<string, string> = { active: "Aktif", graduated: "Lulus", transferred: "Pindah", withdrawn: "Keluar" };
const statuses = ["active", "graduated", "transferred", "withdrawn"];

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; archived?: string; saved?: string }> }) {
  const session = await requirePermission("students:view");
  const params = await searchParams;
  const term = (params.q ?? "").trim().slice(0, 80).replace(/[%,()_*\\]/g, " ");
  const status = statuses.includes(params.status ?? "") ? params.status : "";
  const showArchived = params.archived === "1";
  const supabase = await createClient();
  let request = supabase.from("students").select("id, nis, full_name, enrollment_year, status, archived_at, departments(name)").order("full_name").limit(200);
  request = showArchived ? request.not("archived_at", "is", null) : request.is("archived_at", null);
  if (term) request = request.or("nis.ilike.%" + term + "%,nisn.ilike.%" + term + "%,full_name.ilike.%" + term + "%");
  if (status) request = request.eq("status", status);
  const { data, error } = await request;
  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{showArchived ? "Arsip Siswa" : "Data Siswa"}</h1><p className="mt-1 text-sm text-muted-foreground">Data induk siswa bersifat privat dan hanya tersedia bagi petugas berwenang.</p></div><div className="flex flex-wrap gap-2"><Link href={showArchived ? "/admin/siswa" : "/admin/siswa?archived=1"} className={buttonVariants({ size: "md", variant: "outline" })}>{showArchived ? "Data aktif" : "Lihat arsip"}</Link>{can(session.access, "students:update") && <Link href="/admin/akses-siswa" className={buttonVariants({ size: "md", variant: "outline" })}>Pendaftaran Portal</Link>}{can(session.access, "students:create") && <Link href="/admin/siswa/tambah" className={buttonVariants({ size: "md" })}><Plus className="size-4" aria-hidden /> Tambah siswa</Link>}</div></header>
    {params.saved === "archived" && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">Data siswa berhasil dipindahkan ke arsip.</p>}{params.error && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{params.error === "akses" ? "Anda tidak memiliki izin untuk tindakan tersebut." : params.error === "validasi" ? "Data belum valid." : params.error === "duplikat" ? "NIS atau NISN sudah digunakan siswa lain." : params.error === "tidak_ditemukan" ? "Data siswa tidak ditemukan atau tidak dapat diakses." : params.error === "migrasi_email" ? "Database Supabase belum menerapkan migrasi email siswa. Terapkan migrasi 20261127300000_student_portal_invitation_email_binding.sql, lalu coba lagi." : "Data siswa gagal disimpan. Periksa data dan coba lagi."}</p>}
    <form action="/admin/siswa" method="get" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_200px_auto]">
      <label className="flex flex-col gap-1.5 text-sm font-medium">Cari nama, NIS, atau NISN<Input name="q" type="search" maxLength={80} placeholder="Ketik kata kunci..." defaultValue={params.q ?? ""} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Status<Select name="status" defaultValue={status}><option value="">Semua status</option><option value="active">Aktif</option><option value="graduated">Lulus</option><option value="transferred">Pindah</option><option value="withdrawn">Keluar</option></Select></label>
      <div className="flex items-end gap-2"><button type="submit" className={buttonVariants({ size: "md" })}><Search className="size-4" aria-hidden /> Cari</button><Link href="/admin/siswa" className={buttonVariants({ size: "md", variant: "outline" })}>Reset</Link></div>
    </form>
    {error ? <ErrorState title="Gagal memuat data siswa" description="Periksa koneksi database dan permission akun." /> : !data?.length ? <EmptyState title={showArchived ? "Arsip siswa kosong" : "Data siswa tidak ditemukan"} description={term || status ? "Coba ubah kata kunci atau filter status." : showArchived ? "Siswa yang diarsipkan akan muncul di sini." : "Tambahkan data siswa pertama untuk mulai mengelola data induk."} /> : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">NIS</th><th className="px-5 py-3 font-medium">Nama siswa</th><th className="px-5 py-3 font-medium">Jurusan</th><th className="px-5 py-3 font-medium">Tahun masuk</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Keterangan</th><th className="px-5 py-3 text-right font-medium">Detail</th></tr></thead><tbody className="divide-y divide-border">{data.map((student) => { const department = Array.isArray(student.departments) ? student.departments[0] : student.departments; return <tr key={student.id}><td className="px-5 py-4 font-mono">{student.nis}</td><td className="px-5 py-4 font-semibold">{student.full_name}</td><td className="px-5 py-4">{department?.name ?? "—"}</td><td className="px-5 py-4">{student.enrollment_year}</td><td className="px-5 py-4"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{labels[student.status] ?? student.status}</span></td><td className="px-5 py-4">{student.archived_at ? "Diarsipkan" : "—"}</td><td className="px-5 py-4 text-right"><Link href={"/admin/siswa/" + student.id} className="font-medium text-primary hover:underline">Lihat detail</Link></td></tr>; })}</tbody></table></CardContent></Card>}
    {data?.length === 200 && <p className="text-xs text-muted-foreground">Menampilkan maksimal 200 data. Gunakan pencarian untuk menemukan siswa tertentu.</p>}
  </div>;
}
