import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Menunggu Verifikasi", robots: { index: false, follow: false } };

export default function StudentPortalPendingPage() {
  return <main className="grid min-h-dvh place-items-center bg-muted p-4">
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Pengajuan diterima</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Pengajuan akun Portal Siswa sudah dikirim. Admin sekolah perlu mencocokkan NIS, nama, dan tanggal lahir sebelum akun diaktifkan.</p>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">Kembali ke halaman masuk</Link>
      </CardContent>
    </Card>
  </main>;
}
