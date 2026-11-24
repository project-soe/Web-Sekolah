"use client";

import { Button } from "@/components/ui/button";
import { deleteFacility } from "./facility-actions";

export function DeleteFacilityForm({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteFacility} onSubmit={(event) => {
      if (!window.confirm(`Hapus fasilitas "${name}"? Foto terkait juga akan dihapus.`)) {
        event.preventDefault();
      }
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
