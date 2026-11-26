import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/features/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTeacher } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Ruang Guru" };
export const dynamic = "force-dynamic";

export default async function TeacherPortalPage() {
  const session = await requireTeacher();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">Portal tenaga pendidik</p><h1 className="text-3xl font-bold">Ruang Guru</h1><p className="mt-1 text-sm text-muted-foreground">{session.email}</p></div>
        <form action={logout}><button type="submit" className="text-sm text-primary hover:underline">Keluar</button></form>
      </header>
      <Card>
        <CardHeader><CardTitle>Akun guru aktif</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Akun telah terhubung dengan profil guru sekolah.</p>
          <p>Pengisian kehadiran harian tersedia untuk rombel yang ditugaskan sebagai wali kelas.</p><Link href="/ruang-guru/absensi" className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Buka absensi siswa</Link>
        </CardContent>
      </Card>
    </main>
  );
}
