"use client";

import { Button } from "@/components/ui/button";
import { deleteAnnouncement } from "./announcement-actions";

export function DeleteAnnouncementForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteAnnouncement} onSubmit={(event) => {
      if (!window.confirm(`Hapus pengumuman "${title}"? Tindakan ini tidak dapat dibatalkan.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
