create or replace function public.promote_class_students(source_class_id uuid, target_class_id uuid)
returns integer language plpgsql security invoker set search_path = ''
as $function$
declare
  source_class record; target_class record; source_year record; target_year record;
  promoted_count integer;
begin
  if not public.has_permission('classes:view') or not public.has_permission('students:view')
    or not public.has_permission('classes:update') or not public.has_permission('students:update') then
    raise exception 'Tidak memiliki izin untuk kenaikan kelas massal' using errcode = '42501';
  end if;
  select cg.id, cg.academic_year_id, cg.grade_level into source_class
    from public.class_groups cg where cg.id = source_class_id;
  if not found then raise exception 'Kelas asal tidak ditemukan' using errcode = 'P0002'; end if;
  select cg.id, cg.academic_year_id, cg.grade_level into target_class
    from public.class_groups cg where cg.id = target_class_id;
  if not found then raise exception 'Kelas tujuan tidak ditemukan' using errcode = 'P0002'; end if;
  select ay.id, ay.name, ay.is_active into source_year
    from public.academic_years ay where ay.id = source_class.academic_year_id;
  select ay.id, ay.name into target_year
    from public.academic_years ay where ay.id = target_class.academic_year_id;
  if source_year.is_active is distinct from true then
    raise exception 'Kenaikan hanya dapat dilakukan dari tahun ajaran aktif' using errcode = '23514';
  end if;
  if source_class.grade_level not in (10, 11) or target_class.grade_level <> source_class.grade_level + 1 then
    raise exception 'Tingkat tujuan harus satu tingkat di atas; kelas XII melalui proses kelulusan' using errcode = '23514';
  end if;
  if split_part(target_year.name, '/', 1)::integer <> split_part(source_year.name, '/', 1)::integer + 1 then
    raise exception 'Kelas tujuan harus berada pada tahun ajaran berikutnya' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.student_class_enrollments e
    join public.students s on s.id = e.student_id
    where e.class_group_id = source_class_id and s.status = 'active'
      and exists (select 1 from public.student_class_enrollments next_e
        where next_e.student_id = e.student_id and next_e.academic_year_id = target_year.id)
  ) then
    raise exception 'Sebagian siswa sudah memiliki penempatan pada tahun ajaran tujuan' using errcode = '23505';
  end if;
  insert into public.student_class_enrollments(student_id, academic_year_id, class_group_id, assigned_by)
  select e.student_id, target_year.id, target_class_id, (select auth.uid())
  from public.student_class_enrollments e
  join public.students s on s.id = e.student_id
  where e.class_group_id = source_class_id and s.status = 'active'
  order by e.student_id;
  get diagnostics promoted_count = row_count;
  if promoted_count = 0 then raise exception 'Tidak ada siswa aktif pada kelas asal' using errcode = 'P0002'; end if;
  return promoted_count;
end;
$function$;
revoke all on function public.promote_class_students(uuid, uuid) from public, anon;
grant execute on function public.promote_class_students(uuid, uuid) to authenticated;
comment on function public.promote_class_students(uuid, uuid) is
  'Memindahkan siswa aktif dari kelas X/XI ke tingkat berikutnya pada tahun ajaran berikutnya secara atomik. Kelas XII ditangani melalui kelulusan.';
