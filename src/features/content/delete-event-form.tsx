"use client";

import { Button } from "@/components/ui/button";
import { deleteEvent } from "./event-actions";

export function DeleteEventForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteEvent} onSubmit={(event) => {
      if (!window.confirm(`Hapus agenda "${title}"? Tindakan ini tidak dapat dibatalkan.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
