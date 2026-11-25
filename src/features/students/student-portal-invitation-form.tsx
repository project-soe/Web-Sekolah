"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createStudentPortalInvitation } from "./portal-actions";

export function StudentPortalInvitationForm({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(createStudentPortalInvitation, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="student_id" value={studentId} />
      <p className="text-sm text-muted-foreground">Admin membuat kode undangan khusus siswa ini. Bagikan kode secara pribadi; siswa menggunakannya saat membuat akun. Kode hanya ditampilkan sekali dan berlaku tujuh hari.</p>
      <div><Button type="submit" size="md" variant="outline" loading={pending}>Buat kode undangan</Button></div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.token && <div className="rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold">Kode undangan — salin sekarang</p>
        <code className="mt-2 block break-all text-xs">{state.token}</code>
        <p className="mt-2 text-xs text-muted-foreground">Kode ini tidak dapat ditampilkan kembali. Jika hilang, buat undangan baru.</p>
      </div>}
    </form>
  );
}
