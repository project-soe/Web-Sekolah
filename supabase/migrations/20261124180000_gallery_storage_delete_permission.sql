-- Pengelola yang memiliki galleries:delete juga harus dapat membersihkan objek
-- Storage saat foto atau album dihapus. Tanpa ini, row database terhapus tetapi
-- objek di bucket media tertinggal.
create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','departments:create','departments:update',
    'facilities:create','facilities:update','news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','galleries:delete','achievements:create','achievements:update',
    'extracurriculars:create','extracurriculars:update','events:create','events:update',
    'announcements:create','announcements:update','homepage:update','social:update','users:update'
  ]);
$$;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.can_manage_media() to authenticated;
