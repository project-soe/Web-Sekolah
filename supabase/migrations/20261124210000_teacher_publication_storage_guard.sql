-- Publikasi profil guru memerlukan permission khusus.
insert into public.permissions (code, module, action)
values ('teachers:publish', 'teachers', 'publish')
on conflict (code) do nothing;

-- Row guru yang sudah tampil tidak dapat diedit/dinonaktifkan oleh editor biasa.
drop policy if exists teachers_update on public.teachers;
create policy teachers_update on public.teachers for update to authenticated
  using (
    public.has_permission('teachers:update')
    and (not is_published or public.has_permission('teachers:publish'))
  )
  with check (
    public.has_permission('teachers:update')
    and (not is_published or public.has_permission('teachers:publish'))
  );

drop policy if exists teachers_insert on public.teachers;
create policy teachers_insert on public.teachers for insert to authenticated
  with check (
    public.has_permission('teachers:create')
    and (not is_published or public.has_permission('teachers:publish'))
  );

-- Penghapusan profil juga harus dapat menghapus foto dari bucket media.
create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','teachers:delete',
    'departments:create','departments:update','facilities:create','facilities:update',
    'news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','galleries:delete',
    'achievements:create','achievements:update','achievements:delete',
    'extracurriculars:create','extracurriculars:update','events:create','events:update',
    'events:delete','announcements:create','announcements:update',
    'homepage:update','social:update','users:update'
  ]);
$$;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.can_manage_media() to authenticated;
