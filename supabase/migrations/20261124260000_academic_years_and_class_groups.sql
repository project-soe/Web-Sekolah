-- Tahun ajaran, rombongan belajar, dan penempatan siswa.
-- Seluruh data bersifat privat dan hanya dapat diakses melalui permission RBAC.
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name ~ '^[0-9]{4}/[0-9]{4}$'),
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date),
  check (split_part(name, '/', 1)::integer < split_part(name, '/', 2)::integer)
);
create unique index academic_years_one_active_idx on public.academic_years(is_active) where is_active;

create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  name text not null check (length(btrim(name)) between 3 and 80),
  grade_level smallint not null check (grade_level between 10 and 12),
  department_id uuid references public.departments(id) on delete restrict,
  homeroom_teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, name)
);
create index class_groups_year_idx on public.class_groups(academic_year_id, grade_level, name);

create table public.student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  class_group_id uuid not null references public.class_groups(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null,
  unique (student_id, academic_year_id)
);
create index student_class_enrollments_class_idx on public.student_class_enrollments(class_group_id, student_id);

create table public.student_class_history (
  id bigint generated always as identity primary key,
  enrollment_id uuid not null references public.student_class_enrollments(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  old_class_group_id uuid references public.class_groups(id) on delete restrict,
  new_class_group_id uuid not null references public.class_groups(id) on delete restrict,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.users(id) on delete set null
);
create index student_class_history_student_idx on public.student_class_history(student_id, academic_year_id, changed_at desc);

create trigger academic_years_updated_at before update on public.academic_years for each row execute function public.set_updated_at();
create trigger class_groups_updated_at before update on public.class_groups for each row execute function public.set_updated_at();
create trigger student_class_enrollments_updated_at before update on public.student_class_enrollments for each row execute function public.set_updated_at();

create or replace function public.guard_student_class_enrollment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_year uuid;
  student_status text;
begin
  select cg.academic_year_id into target_year from public.class_groups cg where cg.id = new.class_group_id;
  if target_year is null or target_year <> new.academic_year_id then
    raise exception 'Kelas tidak sesuai dengan tahun ajaran' using errcode = '23514';
  end if;
  select s.status into student_status from public.students s where s.id = new.student_id;
  if student_status is distinct from 'active' then
    raise exception 'Hanya siswa aktif yang dapat ditempatkan ke kelas' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    new.updated_by := (select auth.uid());
  else
    new.assigned_by := coalesce(new.assigned_by, (select auth.uid()));
  end if;
  return new;
end;
$$;
revoke all on function public.guard_student_class_enrollment() from public, anon, authenticated;
create trigger student_class_enrollment_guard before insert or update on public.student_class_enrollments
  for each row execute function public.guard_student_class_enrollment();

create or replace function public.record_student_class_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.student_class_history(
    enrollment_id, student_id, academic_year_id, old_class_group_id, new_class_group_id, changed_by
  ) values (
    new.id, new.student_id, new.academic_year_id,
    case when tg_op = 'UPDATE' then old.class_group_id else null end,
    new.class_group_id, (select auth.uid())
  );
  return new;
end;
$$;
revoke all on function public.record_student_class_change() from public, anon, authenticated;
create trigger student_class_enrollment_history_insert after insert on public.student_class_enrollments
  for each row execute function public.record_student_class_change();
create trigger student_class_enrollment_history_update after update of class_group_id on public.student_class_enrollments
  for each row when (old.class_group_id is distinct from new.class_group_id)
  execute function public.record_student_class_change();

alter table public.academic_years enable row level security;
alter table public.class_groups enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.student_class_history enable row level security;
revoke all on public.academic_years, public.class_groups, public.student_class_enrollments, public.student_class_history from anon;
revoke truncate, references, trigger on public.academic_years, public.class_groups, public.student_class_enrollments, public.student_class_history from authenticated;
grant select, insert, update, delete on public.academic_years, public.class_groups to authenticated;
grant select, insert, update on public.student_class_enrollments to authenticated;
grant select on public.student_class_history to authenticated;

create policy academic_years_select on public.academic_years for select to authenticated using (public.has_permission('classes:view'));
create policy academic_years_insert on public.academic_years for insert to authenticated with check (public.has_permission('classes:create'));
create policy academic_years_update on public.academic_years for update to authenticated using (public.has_permission('classes:update')) with check (public.has_permission('classes:update'));
create policy academic_years_delete on public.academic_years for delete to authenticated using (public.has_permission('classes:delete'));
create policy class_groups_select on public.class_groups for select to authenticated using (public.has_permission('classes:view'));
create policy class_groups_insert on public.class_groups for insert to authenticated with check (public.has_permission('classes:create'));
create policy class_groups_update on public.class_groups for update to authenticated using (public.has_permission('classes:update')) with check (public.has_permission('classes:update'));
create policy class_groups_delete on public.class_groups for delete to authenticated using (public.has_permission('classes:delete'));
create policy student_class_enrollments_select on public.student_class_enrollments for select to authenticated using (public.has_permission('classes:view') and public.has_permission('students:view'));
create policy student_class_enrollments_insert on public.student_class_enrollments for insert to authenticated with check (public.has_permission('classes:update') and public.has_permission('students:update'));
create policy student_class_enrollments_update on public.student_class_enrollments for update to authenticated using (public.has_permission('classes:update') and public.has_permission('students:update')) with check (public.has_permission('classes:update') and public.has_permission('students:update'));
create policy student_class_history_select on public.student_class_history for select to authenticated using (public.has_permission('classes:view') and public.has_permission('students:view'));

comment on table public.academic_years is 'Tahun ajaran internal sekolah; maksimal satu tahun ajaran aktif.';
comment on table public.class_groups is 'Rombongan belajar per tahun ajaran, misalnya X TKJ 1.';
comment on table public.student_class_enrollments is 'Penempatan siswa per tahun ajaran; satu penempatan per siswa dan tahun.';
comment on table public.student_class_history is 'Riwayat otomatis setiap penempatan atau perpindahan kelas.';
