"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerTeacherAccount, verifyTeacherAccountOtp, resendTeacherAccountOtp } from "./teacher-account-actions";

export function TeacherActivationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerTeacherAccount, {});
  const [otpState, otpAction, otpPending] = useActionState(verifyTeacherAccountOtp, {});
  const [resendState, resendAction, resendPending] = useActionState(resendTeacherAccountOtp, {});
  return (
    <form action={action} hidden={Boolean(state.awaitingOtp)} className="flex flex-col gap-4">
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
      <Button type="submit" size="lg" loading={pending}>Buat akun dan kirim kode OTP</Button>
    </form>
    {state.awaitingOtp && <section className="flex flex-col gap-3">
      <p role="status" className="text-sm text-success">{state.message}</p>
      <p className="text-sm text-muted-foreground">Masukkan kode OTP 6 digit yang dikirim ke {state.email}.</p>
      <form action={otpAction} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={state.email ?? ""} />
        <Field id="teacher_otp" label="Kode OTP 6 digit" required>
          <Input id="teacher_otp" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
        </Field>
        {otpState.error && <p role="alert" className="text-sm text-danger">{otpState.error}</p>}
        <Button type="submit" size="lg" loading={otpPending}>Verifikasi dan aktifkan akun</Button>
      </form>
      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={state.email ?? ""} />
        <Button type="submit" variant="secondary" loading={resendPending}>Kirim ulang kode OTP</Button>
        {resendState.error && <p role="alert" className="text-sm text-danger">{resendState.error}</p>}
        {resendState.message && <p role="status" className="text-sm text-success">{resendState.message}</p>}
      </form>
    </section>
  );
}
