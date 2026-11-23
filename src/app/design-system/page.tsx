import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { ToastDemo } from "./toast-demo";

export const metadata: Metadata = { title: "Design System", robots: { index: false } };

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">Design System</h1>

      <section className="flex flex-wrap gap-3" aria-label="Tombol">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Memuat</Button>
        <ToastDemo />
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Badge">
        <Badge>Draft</Badge>
        <Badge variant="primary">Submitted</Badge>
        <Badge variant="success">Verified</Badge>
        <Badge variant="warning">Need correction</Badge>
        <Badge variant="danger">Rejected</Badge>
        <Badge variant="info">Accepted</Badge>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Contoh formulir</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="nama" label="Nama lengkap" required hint="Sesuai ijazah">
            <Input id="nama" placeholder="Nama lengkap" />
          </Field>
          <Field id="email" label="Email" error="Format email tidak valid">
            <Input id="email" defaultValue="salah" invalid />
          </Field>
        </CardContent>
      </Card>

      <section className="grid gap-3" aria-label="Skeleton">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </section>

      <EmptyState
        title="Belum ada data"
        description="Data akan tampil di sini setelah ditambahkan."
      />
      <ErrorState title="Gagal memuat data" description="Periksa koneksi lalu coba lagi." />
    </main>
  );
}
