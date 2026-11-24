-- Publikasi jurusan memerlukan permission khusus.
insert into public.permissions (code, module, action)
values ('departments:publish', 'departments', 'publish')
on conflict (code) do nothing;

-- Konten jurusan yang sudah tampil hanya dapat diubah oleh publisher.
drop policy if exists departments_update on public.departments;
create policy departments_update on public.departments for update to authenticated
  using (
    public.has_permission('departments:update')
    and (not is_published or public.has_permission('departments:publish'))
  )
  with check (
    public.has_permission('departments:update')
    and (not is_published or public.has_permission('departments:publish'))
  );

drop policy if exists departments_insert on public.departments;
create policy departments_insert on public.departments for insert to authenticated
  with check (
    public.has_permission('departments:create')
    and (not is_published or public.has_permission('departments:publish'))
  );

-- Penghapusan jurusan juga dapat membersihkan gambar dari bucket media.
create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','teachers:delete',
    'departments:create','departments:update','departments:delete',
    'facilities:create','facilities:update',
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
