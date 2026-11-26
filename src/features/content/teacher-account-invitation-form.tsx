"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  createTeacherAccountInvitation,
  revokeTeacherAccountInvitation,
  type TeacherInvitationState,
} from "./teacher-account-actions";

export function TeacherAccountInvitationForm({ teacherId, email }: { teacherId: string; email: string | null }) {
  const [state, action, pending] = useActionState<TeacherInvitationState, FormData>(
    createTeacherAccountInvitation,
    {},
  );
  const invitationUrl = state.token
    ? `${typeof window === "undefined" ? "" : window.location.origin}/guru/aktivasi?token=${encodeURIComponent(state.token)}`
    : "";

  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">Akun login guru</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Undangan dikirim ke email profil guru. Guru menetapkan password sendiri dan wajib memverifikasi email.
      </p>
      <p className="mt-2 text-sm">Email undangan: <strong>{email || "Belum diisi"}</strong></p>
      {!state.token ? (
        <form action={action} className="mt-3">
          <input type="hidden" name="teacher_id" value={teacherId} />
          <Button type="submit" disabled={!email} loading={pending}>Buat undangan 24 jam</Button>
        </form>
      ) : (
        <div className="mt-3 space-y-2">
          <p role="status" className="text-sm text-success">Undangan berhasil dibuat. Salin tautan ini dan kirim kepada guru melalui kanal resmi sekolah.</p>
          <div className="break-all rounded-md bg-muted p-3 text-xs">{invitationUrl}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(invitationUrl)}>Salin tautan undangan</Button>
            <form action={revokeTeacherAccountInvitation}>
              <input type="hidden" name="teacher_id" value={teacherId} />
              <Button type="submit" variant="outline">Cabut undangan</Button>
            </form>
          </div>
        </div>
      )}
      {state.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
    </section>
  );
}
