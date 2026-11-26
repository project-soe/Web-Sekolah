"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerTeacherAccount } from "./teacher-account-actions";

export function TeacherActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerTeacherAccount, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="invitation_token" value={token} />
      <Field id="email" label="Email undangan" required>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="password" label="Buat password" required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field id="password_confirmation" label="Ulangi password" required>
        <Input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-success">{state.message}</p>}
      <Button type="submit" size="lg" loading={pending}>Buat akun dan kirim verifikasi</Button>
    </form>
  );
}
