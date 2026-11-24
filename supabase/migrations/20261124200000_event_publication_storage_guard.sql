-- Penguatan RLS agenda: mengubah konten yang sudah terbit memerlukan permission publish.
drop policy if exists events_update on public.events;
create policy events_update on public.events for update to authenticated
  using (
    public.has_permission('events:update')
    and (status <> 'published' or public.has_permission('events:publish'))
  )
  with check (
    public.has_permission('events:update')
    and (status <> 'published' or public.has_permission('events:publish'))
  );

-- Izinkan pembersihan objek gambar agenda melalui policy Storage yang sudah ada.
create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','departments:create','departments:update',
    'facilities:create','facilities:update','news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','galleries:delete','achievements:create','achievements:update',
    'achievements:delete','extracurriculars:create','extracurriculars:update','events:create','events:update',
    'events:delete','announcements:create','announcements:update','homepage:update','social:update','users:update'
  ]);
$$;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.can_manage_media() to authenticated;
