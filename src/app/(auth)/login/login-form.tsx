"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { login } from "@/features/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="email" label="Email" required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required />
      </Field>
      <Field id="password" label="Password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending}>Masuk</Button>
      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>Siswa belum memiliki akun? <Link href="/portal/daftar" className="font-medium text-primary hover:underline">Daftar Portal Siswa</Link></p>
        <p>Masuk sebagai guru? <Link href="/guru/masuk" className="font-medium text-primary hover:underline">Login Guru</Link></p>
      </div>
    </form>
  );
}
