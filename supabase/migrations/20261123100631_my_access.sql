create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'is_super_admin', public.is_super_admin(),
    'roles', coalesce((
      select jsonb_agg(r.slug)
      from public.users u
      join public.user_roles ur on ur.user_id = u.id
      join public.roles r on r.id = ur.role_id
      where u.id = (select auth.uid()) and u.is_active and u.deleted_at is null
    ), '[]'::jsonb),
    'permissions', coalesce((
      select jsonb_agg(distinct p.code)
      from public.users u
      join public.user_roles ur on ur.user_id = u.id
      join public.role_permissions rp on rp.role_id = ur.role_id
      join public.permissions p on p.id = rp.permission_id
      where u.id = (select auth.uid()) and u.is_active and u.deleted_at is null
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;
