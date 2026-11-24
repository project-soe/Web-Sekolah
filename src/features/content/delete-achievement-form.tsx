"use client";

import { Button } from "@/components/ui/button";
import { deleteAchievement } from "./achievement-actions";

export function DeleteAchievementForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteAchievement} onSubmit={(event) => {
      if (!window.confirm(`Hapus prestasi "${title}"? Tindakan ini tidak dapat dibatalkan.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm" variant="danger">Hapus</Button>
    </form>
  );
}
