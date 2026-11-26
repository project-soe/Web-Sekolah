import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "@/features/auth/actions";
import { requireStudent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Portal Siswa" };
export const dynamic = "force-dynamic";

type PortalProfile = {
  student_id: string; full_name: string; nis: string; nisn: string | null; status: string;
  enrollment_year: number; department: string | null; class_name: string | null; academic_year: string | null;
};
const labels: Record<string, string> = { active: "Aktif", graduated: "Lulus", transferred: "Pindah", withdrawn: "Keluar" };

export default async function StudentPortalPage() {
  await requireStudent();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_student_portal_profile");
  if (error || !data) redirect("/login");
  const profile = data as PortalProfile;
  return <main className="min-h-dvh bg-muted/40 p-4 sm:p-8">
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">Portal Siswa</p><h1 className="text-2xl font-bold">{profile.full_name}</h1></div>
        <form action={logout}><button className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Keluar</button></form>
      </header>
      <Card><CardHeader><CardTitle>Data akademik</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs text-muted-foreground">NIS</p><p className="mt-1 font-semibold">{profile.nis}</p></div>
          <div><p className="text-xs text-muted-foreground">NISN</p><p className="mt-1 font-semibold">{profile.nisn ?? "—"}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 font-semibold">{labels[profile.status] ?? profile.status}</p></div>
          <div><p className="text-xs text-muted-foreground">Tahun masuk</p><p className="mt-1 font-semibold">{profile.enrollment_year}</p></div>
          <div><p className="text-xs text-muted-foreground">Jurusan</p><p className="mt-1 font-semibold">{profile.department ?? "Belum ditentukan"}</p></div>
          <div><p className="text-xs text-muted-foreground">Kelas saat ini</p><p className="mt-1 font-semibold">{profile.class_name ?? "Belum ditempatkan"}</p></div>
          <div><p className="text-xs text-muted-foreground">Tahun ajaran</p><p className="mt-1 font-semibold">{profile.academic_year ?? "—"}</p></div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Informasi yang ditampilkan terbatas pada data akademik dasar. Data pribadi dan kontak wali tetap hanya tersedia bagi petugas sekolah berwenang.</p>
    </div>
  </main>;
}
