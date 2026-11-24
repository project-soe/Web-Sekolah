-- Protect audit metadata and enrollment identity from direct PostgREST updates.
-- The application server action already supplies these values, but the database
-- must remain the source of truth for every authenticated client.

create or replace function public.guard_student_class_enrollment()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  target_year uuid;
  student_status text;
begin
  select cg.academic_year_id
    into target_year
    from public.class_groups cg
    where cg.id = new.class_group_id;

  if target_year is null or target_year <> new.academic_year_id then
    raise exception 'Kelas tidak sesuai dengan tahun ajaran'
      using errcode = '23514';
  end if;

  select s.status
    into student_status
    from public.students s
    where s.id = new.student_id;

  if student_status is distinct from 'active' then
    raise exception 'Hanya siswa aktif yang dapat ditempatkan ke kelas'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    -- Never trust an actor UUID supplied by the client.
    new.assigned_by := (select auth.uid());
  else
    -- A transfer changes only the class group. The enrollment identity and
    -- original assignment metadata must remain immutable.
    if new.student_id is distinct from old.student_id
      or new.academic_year_id is distinct from old.academic_year_id
      or new.assigned_at is distinct from old.assigned_at
      or new.assigned_by is distinct from old.assigned_by then
      raise exception 'Identitas dan metadata awal penempatan tidak dapat diubah'
        using errcode = '42501';
    end if;

    new.updated_by := (select auth.uid());
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_student_class_enrollment()
  from public, anon, authenticated;

comment on function public.guard_student_class_enrollment() is
  'Memvalidasi kesesuaian siswa/kelas/tahun ajaran dan melindungi metadata audit penempatan.';
