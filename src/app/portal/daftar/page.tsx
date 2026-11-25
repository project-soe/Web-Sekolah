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
        {params.error === "konfirmasi" && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">Konfirmasi email berhasil, tetapi pengajuan belum dapat disimpan. Silakan masuk kembali atau hubungi admin sekolah.</p>}
        <StudentPortalSignupForm />
        <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">Kembali ke halaman masuk</Link>
      </CardContent>
    </Card>
  </main>;
}
