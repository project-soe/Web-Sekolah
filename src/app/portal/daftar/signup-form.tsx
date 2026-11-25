"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerStudentPortal } from "@/features/auth/actions";

export function StudentPortalSignupForm() {
  const [state, action, pending] = useActionState(registerStudentPortal, {});
  return <form action={action} className="flex flex-col gap-4">
    <Field id="full_name" label="Nama lengkap sesuai data sekolah" required><Input id="full_name" name="full_name" autoComplete="name" required maxLength={150} /></Field>
    <Field id="email" label="Email aktif" required><Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required /></Field>
    <Field id="password" label="Buat password (minimal 8 karakter)" required><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></Field>
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-semibold">Punya kode undangan dari admin?</p>
      <p className="mt-1 text-xs text-muted-foreground">Masukkan kode undangan untuk menghubungkan akun langsung ke data siswa yang ditentukan admin.</p>
      <Input name="invitation_token" aria-label="Kode undangan admin" placeholder="Tempel kode undangan (opsional)" className="mt-3" />
    </div>
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-semibold">Atau daftar mandiri</p>
      <p className="mt-1 text-xs text-muted-foreground">Isi NIS dan tanggal lahir sesuai data sekolah. Akun akan menunggu verifikasi admin.</p>
      <div className="mt-3 flex flex-col gap-3">
        <Field id="nis" label="NIS"><Input id="nis" name="nis" maxLength={30} autoComplete="off" /></Field>
        <Field id="birth_date" label="Tanggal lahir"><Input id="birth_date" name="birth_date" type="date" /></Field>
      </div>
    </div>
    {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
    {state.message && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">{state.message}</p>}
    <Button type="submit" size="lg" loading={pending}>Buat akun Portal Siswa</Button>
    <p className="text-center text-sm text-muted-foreground">Sudah punya akun? <Link href="/login" className="font-medium text-primary hover:underline">Masuk</Link></p>
  </form>;
}
