import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteDefaults } from "@/config/site";
import { StudentPortalSignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Daftar Portal Siswa", robots: { index: false, follow: false } };

export default async function StudentPortalSignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="grid min-h-dvh place-items-center bg-muted p-4">
    <Card className="w-full max-w-lg">
      <CardHeader><CardTitle>Daftar Portal Siswa</CardTitle><p className="text-sm text-muted-foreground">{siteDefaults.name}</p></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Gunakan undangan dari admin atau ajukan akun mandiri. Pendaftaran mandiri hanya aktif setelah data cocok dan disetujui sekolah.</p>
        {params.error === "lanjutkan" && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-900">Email berhasil dikonfirmasi, tetapi pengajuan belum tersimpan. Lengkapi formulir pemulihan di bawah. Jangan mendaftar ulang.</p>}
        {params.error === "konfirmasi" && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">Tautan konfirmasi tidak dapat diproses. Periksa kembali tautan atau hubungi admin sekolah.</p>}
        <StudentPortalSignupForm recoveryMode={params.error === "lanjutkan"} />
        <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">Kembali ke halaman masuk</Link>
      </CardContent>
    </Card>
  </main>;
}
