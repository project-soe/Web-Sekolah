"use client";

import { deleteGallery } from "./gallery-actions";
import { Button } from "@/components/ui/button";

export function DeleteGalleryForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteGallery} onSubmit={(event) => {
      if (!window.confirm(`Hapus album "${title}" beserta seluruh fotonya?`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="danger" size="sm">Hapus</Button>
    </form>
  );
}
