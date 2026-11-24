import { Button } from "@/components/ui/button";
import { deleteFacility } from "./facility-actions";

export function DeleteFacilityForm({ id, name }: { id: string; name: string }) {
  return <form action={deleteFacility}>
    <input type="hidden" name="id" value={id} />
    <Button type="submit" size="sm" variant="danger"
      onClick={(event) => {
        if (!window.confirm(`Hapus fasilitas "${name}"? Gambar terkait juga akan dihapus.`)) event.preventDefault();
      }}>Hapus</Button>
  </form>;
}
