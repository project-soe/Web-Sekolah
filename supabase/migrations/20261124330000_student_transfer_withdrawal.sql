-- Close the current-year class placement when a student transfers or withdraws.
-- Enrollment rows remain as immutable historical records; only their active slot is released.
alter table public.student_class_enrollments
  add column ended_at timestamptz,
  add column ended_by uuid references public.users(id) on delete set null;

comment on column public.student_class_enrollments.ended_at is
  'Waktu penempatan kelas ditutup karena siswa pindah atau mengundurkan diri. NULL berarti penempatan masih aktif.';
comment on column public.student_class_enrollments.ended_by is
  'Aktor yang menutup penempatan; selalu diisi dari auth.uid() oleh RPC lifecycle.';

revoke update on public.student_class_enrollments from authenticated;
grant update (class_group_id) on public.student_class_enrollments to authenticated;

create or replace function public.guard_student_class_enrollment()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare target_year uuid; student_status text;
begin
  if tg_op = 'INSERT' then
    if new.ended_at is not null or new.ended_by is not null then
      raise exception 'Penempatan baru harus berstatus aktif' using errcode = '23514';
    end if;
    update public.class_groups set enrolled_count = enrolled_count + 1
    where id = new.class_group_id and academic_year_id = new.academic_year_id
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
    return new;
  end if;

  if new.student_id is distinct from old.student_id
    or new.academic_year_id is distinct from old.academic_year_id
    or new.assigned_at is distinct from old.assigned_at
    or new.assigned_by is distinct from old.assigned_by then
    raise exception 'Identitas dan metadata awal penempatan tidak dapat diubah' using errcode = '42501';
  end if;
  if old.ended_at is not null then
    raise exception 'Penempatan yang sudah ditutup tidak dapat diubah' using errcode = '42501';
  end if;
  if new.class_group_id is distinct from old.class_group_id
    and (new.ended_at is distinct from old.ended_at or new.ended_by is distinct from old.ended_by) then
    raise exception 'Perpindahan kelas dan penutupan penempatan harus terpisah' using errcode = '23514';
  end if;
  if new.ended_at is distinct from old.ended_at then
    if new.ended_at is null or new.ended_by is distinct from (select auth.uid()) then
      raise exception 'Penutupan penempatan harus melalui proses lifecycle' using errcode = '42501';
    end if;
  elsif new.ended_by is distinct from old.ended_by then
    raise exception 'Metadata penutupan tidak dapat diubah' using errcode = '42501';
  end if;

  if new.class_group_id is distinct from old.class_group_id then
    perform cg.id from public.class_groups cg
    where cg.id in (old.class_group_id, new.class_group_id)
    order by cg.id for update;
    update public.class_groups set enrolled_count = enrolled_count + 1
    where id = new.class_group_id and academic_year_id = new.academic_year_id
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
      raise exception 'Hanya siswa aktif yang dapat dipindahkan ke kelas' using errcode = '23514';
    end if;
  end if;
  new.updated_by := (select auth.uid());
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
  if new.class_group_id is distinct from old.class_group_id
    or (old.ended_at is null and new.ended_at is not null) then
    update public.class_groups set enrolled_count = enrolled_count - 1
    where id = old.class_group_id and enrolled_count > 0;
  end if;
  return new;
end;
$function$;
revoke all on function public.sync_class_group_enrollment_count() from public, anon, authenticated;
drop trigger if exists student_class_enrollment_count_update on public.student_class_enrollments;
create trigger student_class_enrollment_count_update
  after update of class_group_id, ended_at on public.student_class_enrollments
  for each row execute function public.sync_class_group_enrollment_count();

create or replace function public.transition_student_status(p_student_id uuid, p_new_status text)
returns integer language plpgsql security definer set search_path = '' as $function$
declare current_student record; active_year_id uuid; closed_count integer := 0;
begin
  if not public.has_permission('classes:view') or not public.has_permission('students:view')
    or not public.has_permission('classes:update') or not public.has_permission('students:update') then
    raise exception 'Tidak memiliki izin untuk mengubah status siswa' using errcode = '42501';
  end if;
  if p_new_status is null or p_new_status not in ('transferred', 'withdrawn') then
    raise exception 'Status tujuan hanya boleh pindah atau mengundurkan diri' using errcode = '23514';
  end if;
  select s.id, s.status into current_student from public.students s
  where s.id = p_student_id for update;
  if not found then raise exception 'Siswa tidak ditemukan' using errcode = 'P0002'; end if;
  if current_student.status <> 'active' then
    raise exception 'Hanya siswa aktif yang dapat diproses' using errcode = '23514';
  end if;

  select ay.id into active_year_id from public.academic_years ay
  where ay.is_active is true for share;
  if active_year_id is not null then
    update public.student_class_enrollments
    set ended_at = now(), ended_by = (select auth.uid())
    where student_id = p_student_id and academic_year_id = active_year_id and ended_at is null;
    get diagnostics closed_count = row_count;
  end if;
  update public.students set status = p_new_status, updated_by = (select auth.uid())
  where id = p_student_id;
  return closed_count;
end;
$function$;
revoke all on function public.transition_student_status(uuid, text) from public, anon, authenticated;
grant execute on function public.transition_student_status(uuid, text) to authenticated;
comment on function public.transition_student_status(uuid, text) is
  'Mengubah siswa aktif menjadi transferred/withdrawn dan menutup penempatan pada tahun ajaran aktif secara atomik; baris penempatan dan histori tidak dihapus.';
