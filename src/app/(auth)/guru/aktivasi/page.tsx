import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherActivationForm } from "@/features/auth/teacher-activation-form";

export const metadata: Metadata = {
  title: "Aktivasi Akun Guru",
  robots: { index: false, follow: false },
};

export default async function TeacherActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const validToken = token && /^[0-9a-f]{64}$/.test(token) ? token : "";
  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aktivasi Akun Guru</CardTitle>
          <p className="text-sm text-muted-foreground">Gunakan email yang menerima undangan. Tautan berlaku 24 jam dan hanya dapat digunakan sekali.</p>
        </CardHeader>
        <CardContent>
          {validToken ? <TeacherActivationForm token={validToken} /> : (
            <p role="alert" className="text-sm text-danger">Tautan undangan tidak valid. Minta admin sekolah membuat undangan baru.</p>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground"><Link href="/login" className="text-primary hover:underline">Kembali ke halaman masuk</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}
