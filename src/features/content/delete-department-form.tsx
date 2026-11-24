"use client";

import { Button } from "@/components/ui/button";
import { deleteDepartment } from "./department-actions";

export function DeleteDepartmentForm({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteDepartment} onSubmit={(event) => {
      if (!window.confirm(`Hapus jurusan "${name}"? Guru yang terhubung akan tetap ada tanpa relasi jurusan.`)) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
