import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteDefaults } from "@/config/site";
import { TeacherLoginForm } from "./teacher-login-form";

export const metadata: Metadata = {
  title: "Masuk Guru",
  robots: { index: false, follow: false },
};

export default function TeacherLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" aria-hidden />
          </div>
          <CardTitle>Masuk Guru</CardTitle>
          <p className="text-sm text-muted-foreground">{siteDefaults.name} · Ruang Guru</p>
        </CardHeader>
        <CardContent>
          <TeacherLoginForm />
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Belum memiliki akun guru? Minta admin sekolah mengirimkan undangan aktivasi.
          </p>
          <p className="mt-3 text-center text-sm">
            <Link href="/login" className="font-medium text-primary hover:underline">Masuk melalui halaman umum</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
