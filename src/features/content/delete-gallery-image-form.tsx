"use client";

import { deleteGalleryImage } from "./gallery-actions";
import { Button } from "@/components/ui/button";

export function DeleteGalleryImageForm({ id }: { id: string }) {
  return (
    <form action={deleteGalleryImage} onSubmit={(event) => {
      if (!window.confirm("Hapus foto ini dari album?")) event.preventDefault();
    }}>
      <input type="hidden" name="image_id" value={id} />
      <Button type="submit" variant="danger" size="sm">Hapus foto</Button>
    </form>
  );
}
