"use client";

import { Button } from "@/components/ui/button";
import { deleteTeacher } from "./teacher-actions";

export function DeleteTeacherForm({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteTeacher} onSubmit={(event) => {
      if (!window.confirm(`Hapus data guru "${name}"? Foto profil juga akan dihapus dari Storage.`)) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
