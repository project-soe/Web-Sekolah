"use client";

import { deleteNews } from "./news-actions";
import { Button } from "@/components/ui/button";

export function DeleteNewsForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteNews} onSubmit={(event) => {
      if (!window.confirm(`Hapus berita "${title}"? Tindakan ini tidak dapat dibatalkan.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
