"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { createStudentPortalInvitation } from "./portal-actions";

export function StudentPortalInvitationForm({ studentId, email }: { studentId: string; email: string }) {
  const [state, action, pending] = useActionState(createStudentPortalInvitation, {});
  const [copyMessage, setCopyMessage] = useState("");
  async function copyInvitationToken() {
    if (!state.token) return;
    try {
      await navigator.clipboard.writeText(state.token);
      setCopyMessage("Kode undangan berhasil disalin.");
    } catch {
      setCopyMessage("Penyalinan otomatis tidak tersedia. Tekan lama kode di atas lalu pilih Salin.");
    }
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="student_id" value={studentId} />
      <p className="text-sm text-muted-foreground">Undangan ini dikunci untuk email {email}. Siswa harus membuat akun Portal Siswa menggunakan alamat email yang sama persis. Kode hanya ditampilkan sekali dan berlaku tujuh hari.</p>
      <div><Button type="submit" size="md" variant="outline" loading={pending}>Buat kode undangan</Button></div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.token && <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold">Kode undangan</p>
        <code className="mt-2 block select-all break-all rounded-md bg-background p-2 text-xs">{state.token}</code>
        <Button type="button" size="md" variant="secondary" onClick={copyInvitationToken} className="mt-3">Salin kode undangan</Button>
        {copyMessage && <p role="status" className="mt-2 text-xs text-muted-foreground">{copyMessage}</p>}
        <p className="mt-2 text-xs text-muted-foreground">Kode hanya ditampilkan sekali dan berlaku tujuh hari. Jika hilang, buat undangan baru.</p>
      </div>}
    </form>
  );
}
