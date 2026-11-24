-- Menambahkan foto ke album adalah perubahan album, sehingga cukup memerlukan galleries:update.
-- Policy lama meminta galleries:create DAN galleries:update sekaligus, yang menolak editor
-- dengan permission update saja meskipun ia berhak mengelola album yang sudah ada.
drop policy if exists gallery_images_insert on public.gallery_images;

create policy gallery_images_insert on public.gallery_images for insert to authenticated
  with check (
    public.has_permission('galleries:update')
    and exists (
      select 1 from public.galleries g
      where g.id = gallery_images.gallery_id
    )
  );
