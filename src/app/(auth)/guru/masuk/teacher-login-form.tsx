"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { loginTeacher } from "@/features/auth/teacher-login-action";

export function TeacherLoginForm() {
  const [state, action, pending] = useActionState(loginTeacher, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field id="teacher-email" label="Email guru" required>
        <Input id="teacher-email" name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      </Field>
      <Field id="teacher-password" label="Password" required>
        <Input id="teacher-password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="lg" loading={pending}>Masuk ke Ruang Guru</Button>
    </form>
  );
}
