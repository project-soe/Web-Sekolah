-- Atomically switch the active academic year.
-- SECURITY INVOKER ensures UPDATE statements remain subject to caller grants and RLS.
create or replace function public.activate_academic_year(target_year_id uuid)
returns uuid
language plpgsql
security invoker
set search_path to ''
as $function$
declare
  activated_id uuid;
begin
  if not public.has_permission('classes:update') then
    raise exception 'Tidak memiliki izin mengaktifkan tahun ajaran'
      using errcode = '42501';
  end if;

  -- Serialize concurrent activation requests so the partial unique index
  -- never observes two competing transactions activating different years.
  perform pg_catalog.pg_advisory_xact_lock(2026112428, 1);

  update public.academic_years
    set is_active = false
    where is_active = true;

  update public.academic_years
    set is_active = true
    where id = target_year_id
    returning id into activated_id;

  if activated_id is null then
    raise exception 'Tahun ajaran tidak ditemukan atau tidak dapat diakses'
      using errcode = 'P0002';
  end if;

  return activated_id;
end;
$function$;

revoke all on function public.activate_academic_year(uuid)
  from public, anon;
grant execute on function public.activate_academic_year(uuid)
  to authenticated;

comment on function public.activate_academic_year(uuid) is
  'Mengaktifkan satu tahun ajaran secara atomik dengan pemeriksaan permission dan RLS.';
