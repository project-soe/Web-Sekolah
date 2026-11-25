import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteDefaults } from "@/config/site";
import { StudentPortalSignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Daftar Portal Siswa", robots: { index: false, follow: false } };

export default function StudentPortalSignupPage() {
  return <main className="grid min-h-dvh place-items-center bg-muted p-4">
    <Card className="w-full max-w-lg">
      <CardHeader><CardTitle>Daftar Portal Siswa</CardTitle><p className="text-sm text-muted-foreground">{siteDefaults.name}</p></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Gunakan undangan dari admin atau ajukan akun mandiri. Pendaftaran mandiri hanya aktif setelah data cocok dan disetujui sekolah.</p>
        <StudentPortalSignupForm />
        <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-primary">Kembali ke halaman masuk</Link>
      </CardContent>
    </Card>
  </main>;
}
