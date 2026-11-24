-- Penguatan publikasi prestasi dan izin pembersihan gambar di Storage.
-- Perubahan isi record yang sudah terbit memerlukan permission publish,
-- bukan hanya saat status diubah menjadi published.

drop policy if exists achievements_update on public.achievements;
create policy achievements_update on public.achievements for update to authenticated
  using (
    public.has_permission('achievements:update')
    and (status <> 'published' or public.has_permission('achievements:publish'))
  )
  with check (
    public.has_permission('achievements:update')
    and (status <> 'published' or public.has_permission('achievements:publish'))
  );

create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','departments:create','departments:update',
    'facilities:create','facilities:update','news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','galleries:delete','achievements:create','achievements:update',
    'achievements:delete','extracurriculars:create','extracurriculars:update','events:create','events:update',
    'announcements:create','announcements:update','homepage:update','social:update','users:update'
  ]);
$$;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.can_manage_media() to authenticated;
