-- Enforce student lifecycle transitions at the database privilege boundary.
-- Generic authenticated clients may manage demographic/master data only.
revoke insert, update on public.students from authenticated;

grant insert (
  nis, nisn, full_name, gender, birth_place, birth_date, address,
  guardian_name, guardian_phone, department_id, enrollment_year, notes
) on public.students to authenticated;

grant update (
  nis, nisn, full_name, gender, birth_place, birth_date, address,
  guardian_name, guardian_phone, department_id, enrollment_year, notes
) on public.students to authenticated;

-- Audit actor metadata is always derived from the authenticated JWT, never client input.
create or replace function public.set_student_audit_actor()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.created_by := old.created_by;
    new.updated_by := (select auth.uid());
  end if;
  return new;
end;
$function$;

revoke all on function public.set_student_audit_actor() from public, anon, authenticated;
create trigger students_audit_actor
  before insert or update on public.students
  for each row execute function public.set_student_audit_actor();

-- The only authenticated lifecycle mutation is the permission-checked graduation RPC.
create or replace function public.graduate_class_students(p_source_class_id uuid, p_graduation_date date)
returns integer language plpgsql security definer set search_path = ''
as $function$
declare source_class record; source_year record; graduated_count integer;
begin
  if not public.has_permission('classes:view') or not public.has_permission('students:view')
    or not public.has_permission('classes:update') or not public.has_permission('students:update') then
    raise exception 'Tidak memiliki izin untuk kelulusan massal' using errcode = '42501';
  end if;
  if p_graduation_date is null then
    raise exception 'Tanggal kelulusan wajib diisi' using errcode = '22004';
  end if;
  select cg.id, cg.academic_year_id, cg.grade_level into source_class
  from public.class_groups cg where cg.id = p_source_class_id for update;
  if not found then raise exception 'Kelas asal tidak ditemukan' using errcode = 'P0002'; end if;
  select ay.id, ay.is_active into source_year
  from public.academic_years ay where ay.id = source_class.academic_year_id for share;
  if source_year.is_active is distinct from true then
    raise exception 'Kelulusan hanya dapat dilakukan dari tahun ajaran aktif' using errcode = '23514';
  end if;
  if source_class.grade_level <> 12 then
    raise exception 'Kelulusan massal hanya berlaku untuk kelas XII' using errcode = '23514';
  end if;
  update public.students s
    set status = 'graduated', graduation_date = p_graduation_date, updated_by = (select auth.uid())
    where s.status = 'active' and exists (
      select 1 from public.student_class_enrollments e
      where e.student_id = s.id and e.class_group_id = source_class.id
        and e.academic_year_id = source_class.academic_year_id
    );
  get diagnostics graduated_count = row_count;
  if graduated_count = 0 then
    raise exception 'Tidak ada siswa aktif yang dapat diluluskan pada kelas ini' using errcode = 'P0002';
  end if;
  return graduated_count;
end;
$function$;

revoke all on function public.graduate_class_students(uuid, date) from public, anon, authenticated;
grant execute on function public.graduate_class_students(uuid, date) to authenticated;

comment on function public.graduate_class_students(uuid, date) is
  'Mengubah status seluruh siswa aktif pada satu rombel XII di tahun ajaran aktif secara atomik; satu-satunya jalur lifecycle yang tersedia bagi role authenticated.';
