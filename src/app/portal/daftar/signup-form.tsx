"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { registerStudentPortal, resendStudentPortalConfirmation, retryStudentPortalRegistration, verifyStudentPortalOtp } from "@/features/auth/actions";

function ResendCooldownButton({ pending, startCooldown }: { pending: boolean; startCooldown: boolean }) {
  const [remaining, setRemaining] = useState(startCooldown ? 60 : 0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining > 0]);

  return (
    <Button
      type="submit"
      variant="secondary"
      loading={pending}
      disabled={pending || remaining > 0}
      onClick={() => setRemaining(60)}
    >
      {remaining > 0
        ? `Kirim ulang tersedia dalam 00:${String(remaining).padStart(2, "0")}`
        : "Kirim ulang kode OTP"}
    </Button>
  );
}

export function StudentPortalSignupForm({ recoveryMode = false }: { recoveryMode?: boolean }) {
  const [state, action, pending] = useActionState(registerStudentPortal, {});
  const [resendState, resendAction, resendPending] = useActionState(resendStudentPortalConfirmation, {});
  const [otpState, otpAction, otpPending] = useActionState(verifyStudentPortalOtp, {});
  const [retryState, retryAction, retryPending] = useActionState(retryStudentPortalRegistration, {});
  const [selfRegistrationEnabled, setSelfRegistrationEnabled] = useState(false);
  const awaitingOtp = Boolean(state.awaitingOtp || resendState.awaitingOtp);
  const otpEmail = resendState.awaitingOtp ? resendState.email : state.email;

  return <div className="flex flex-col gap-6">
    {recoveryMode ? (
    <section className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-slate-900">
      <h2 className="text-base font-semibold">Lanjutkan penyimpanan pengajuan</h2>
      <p className="mt-1 text-sm">Email akun sudah terkonfirmasi. Isi data berikut agar pengajuan dapat disimpan dan diperiksa admin. Gunakan data yang sama persis dengan data siswa di sekolah.</p>
      <form action={retryAction} className="mt-4 flex flex-col gap-3">
        <Field id="retry_full_name" label="Nama lengkap sesuai data sekolah" required>
          <Input id="retry_full_name" name="full_name" autoComplete="name" minLength={2} maxLength={150} required />
        </Field>
        <Field id="retry_nis" label="NIS" required><Input id="retry_nis" name="nis" maxLength={30} required /></Field>
        <Field id="retry_birth_date" label="Tanggal lahir" required><Input id="retry_birth_date" name="birth_date" type="date" required /></Field>
        {retryState.error && <p role="alert" className="text-sm text-danger">{retryState.error}</p>}
        <Button type="submit" size="lg" variant="secondary" loading={retryPending}>Lanjutkan pengajuan</Button>
      </form>
    </section>
    ) : (
    <>
    <form action={action} hidden={awaitingOtp} className="flex flex-col gap-4">
      <Field id="full_name" label="Nama lengkap sesuai data sekolah" required><Input id="full_name" name="full_name" autoComplete="name" required maxLength={150} /></Field>
      <Field id="email" label="Email aktif" required><Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required /></Field>
      <Field id="password" label="Buat password (minimal 8 karakter)" required><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required /></Field>
      <div className="rounded-lg border border-border p-3"><p className="text-sm font-semibold">Punya kode undangan dari admin?</p><p className="mt-1 text-xs text-muted-foreground">Masukkan kode undangan untuk menghubungkan akun langsung ke data siswa yang ditentukan admin.</p><Input name="invitation_token" aria-label="Kode undangan admin" placeholder="Tempel kode undangan (opsional)" className="mt-3" /></div>
      <div className="rounded-lg border border-border p-3">
        <p className="text-sm font-semibold">Atau daftar mandiri</p>
        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" name="self_registration_consent" value="true" checked={selfRegistrationEnabled} onChange={(event) => setSelfRegistrationEnabled(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" /><span>Saya menyetujui pengajuan akun mandiri dan bersedia menunggu verifikasi admin sekolah.</span></label>
        <p className="mt-2 text-xs text-muted-foreground">Centang persetujuan di atas untuk membuka formulir. Data NIS, nama, dan tanggal lahir akan dicocokkan admin sebelum akun diaktifkan.</p>
        <div className="mt-3 flex flex-col gap-3"><Field id="nis" label="NIS"><Input id="nis" name="nis" maxLength={30} autoComplete="off" disabled={!selfRegistrationEnabled} required={selfRegistrationEnabled} /></Field><Field id="birth_date" label="Tanggal lahir"><Input id="birth_date" name="birth_date" type="date" disabled={!selfRegistrationEnabled} required={selfRegistrationEnabled} /></Field></div>
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.message && <p role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">{state.message}</p>}
      <Button type="submit" size="lg" loading={pending}>Buat akun Portal Siswa</Button>
      <p className="text-center text-sm text-muted-foreground">Sudah punya akun? <Link href="/login" className="font-medium text-primary hover:underline">Masuk</Link></p>
    </form>
    {awaitingOtp && <section className="rounded-xl border border-primary/30 bg-muted/40 p-4">
      <h2 className="font-semibold">Verifikasi email dengan kode OTP</h2>
      <p className="mt-1 text-sm text-muted-foreground">Kode verifikasi telah dikirim ke {otpEmail}. Masukkan 6 digit kode tersebut.</p>
      <form action={otpAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="email" value={otpEmail ?? ""} />
        <Field id="student_otp" label="Kode verifikasi 6 digit" required>
          <Input id="student_otp" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
        </Field>
        {otpState.error && <p role="alert" className="text-sm text-danger">{otpState.error}</p>}
        <Button type="submit" size="lg" loading={otpPending}>Verifikasi kode</Button>
      </form>
    </section>}
    <section className="rounded-xl border border-border bg-muted/40 p-4">
      <h2 className="font-semibold">Kode OTP belum masuk?</h2>
      <p className="mt-1 text-sm text-muted-foreground">Jika sebelumnya sudah mendaftar tetapi belum menerima email, minta kode OTP baru di sini. Tidak perlu membuat akun ulang. Setelah permintaan, tunggu minimal 60 detik sebelum mencoba lagi.</p>
      <p className="mt-2 text-xs text-muted-foreground">Catatan: layanan email bawaan Supabase dibatasi hingga 2 email per jam untuk seluruh project sekolah. Countdown hanya menunjukkan jeda minimum; jika kuota project habis, email tetap belum dapat dikirim sampai kuota tersedia kembali.</p>
      <form action={resendAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><Field id="resend_email" label="Email yang digunakan saat mendaftar" required><Input id="resend_email" name="email" type="email" autoComplete="email" defaultValue={state.email} key={state.email ?? "resend-email"} required /></Field></div><ResendCooldownButton key={state.message || resendState.message || "ready"} pending={resendPending} startCooldown={Boolean(state.message || resendState.message)} /></form>
      {resendState.error && <p role="alert" className="mt-3 text-sm text-danger">{resendState.error}</p>}
      {resendState.message && <p role="status" className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">{resendState.message}</p>}
    </section>
    </>
    )}
  </div>;
}
