-- Class capacity is enforced in PostgreSQL, including concurrent enrollment requests.
-- 36 is the initial default for SMK classes; administrators may configure 1..60.
alter table public.class_groups
  add column capacity integer not null default 36 check (capacity between 1 and 60),
  add column enrolled_count integer not null default 0 check (enrolled_count >= 0);

update public.class_groups cg
set enrolled_count = (
  select count(*)::integer from public.student_class_enrollments e
  where e.class_group_id = cg.id
);

create or replace function public.guard_class_group_capacity()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if tg_op = 'INSERT' then
    new.enrolled_count := 0;
  else
    new.enrolled_count := old.enrolled_count;
    if new.capacity < old.enrolled_count then
      raise exception 'Kapasitas tidak boleh lebih kecil dari jumlah siswa saat ini'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_class_group_capacity() from public, anon, authenticated;

create trigger class_group_capacity_guard
  before insert or update of capacity, enrolled_count on public.class_groups
  for each row execute function public.guard_class_group_capacity();

create or replace function public.guard_student_class_enrollment()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  target_year uuid;
  student_status text;
begin
  if tg_op = 'INSERT' then
    update public.class_groups set enrolled_count = enrolled_count + 1
    where id = new.class_group_id
      and academic_year_id = new.academic_year_id
      and enrolled_count < capacity
    returning academic_year_id into target_year;

    if target_year is null then
      if not exists (select 1 from public.class_groups
        where id = new.class_group_id and academic_year_id = new.academic_year_id) then
        raise exception 'Kelas tidak sesuai dengan tahun ajaran' using errcode = '23514';
      end if;
      raise exception 'Kapasitas kelas sudah penuh' using errcode = '23514';
    end if;

    select s.status into student_status from public.students s where s.id = new.student_id;
    if student_status is distinct from 'active' then
      raise exception 'Hanya siswa aktif yang dapat ditempatkan ke kelas' using errcode = '23514';
    end if;
    new.assigned_by := (select auth.uid());
  else
    if new.student_id is distinct from old.student_id
      or new.academic_year_id is distinct from old.academic_year_id
      or new.assigned_at is distinct from old.assigned_at
      or new.assigned_by is distinct from old.assigned_by then
      raise exception 'Identitas dan metadata awal penempatan tidak dapat diubah'
        using errcode = '42501';
    end if;

    select s.status into student_status from public.students s where s.id = new.student_id;
    if student_status is distinct from 'active' then
      raise exception 'Hanya siswa aktif yang dapat ditempatkan ke kelas' using errcode = '23514';
    end if;

    if new.class_group_id is distinct from old.class_group_id then
      perform cg.id from public.class_groups cg
      where cg.id in (old.class_group_id, new.class_group_id)
      order by cg.id for update;

      update public.class_groups set enrolled_count = enrolled_count + 1
      where id = new.class_group_id
        and academic_year_id = new.academic_year_id
        and enrolled_count < capacity
      returning academic_year_id into target_year;

      if target_year is null then
        if not exists (select 1 from public.class_groups
          where id = new.class_group_id and academic_year_id = new.academic_year_id) then
          raise exception 'Kelas tidak sesuai dengan tahun ajaran' using errcode = '23514';
        end if;
        raise exception 'Kapasitas kelas sudah penuh' using errcode = '23514';
      end if;
    end if;
    new.updated_by := (select auth.uid());
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_student_class_enrollment() from public, anon, authenticated;

create or replace function public.sync_class_group_enrollment_count()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  if tg_op = 'DELETE' then
    update public.class_groups set enrolled_count = enrolled_count - 1
    where id = old.class_group_id and enrolled_count > 0;
    return old;
  end if;
  if new.class_group_id is distinct from old.class_group_id then
    update public.class_groups set enrolled_count = enrolled_count - 1
    where id = old.class_group_id and enrolled_count > 0;
  end if;
  return new;
end;
$function$;
revoke all on function public.sync_class_group_enrollment_count() from public, anon, authenticated;

create trigger student_class_enrollment_count_update
  after update of class_group_id on public.student_class_enrollments
  for each row when (old.class_group_id is distinct from new.class_group_id)
  execute function public.sync_class_group_enrollment_count();
create trigger student_class_enrollment_count_delete
  after delete on public.student_class_enrollments
  for each row execute function public.sync_class_group_enrollment_count();

comment on column public.class_groups.capacity is
  'Batas maksimum penempatan siswa pada rombongan belajar (default 36; rentang 1..60).';
comment on column public.class_groups.enrolled_count is
  'Counter penempatan siswa yang dikelola secara atomik oleh trigger database.';
