-- Data induk siswa bersifat privat; tidak ada policy untuk anon/public.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique check (length(btrim(nis)) between 1 and 30),
  nisn text unique check (nisn is null or nisn ~ '^[0-9]{10}$'),
  full_name text not null check (length(btrim(full_name)) between 2 and 150),
  gender text not null check (gender in ('male','female')),
  birth_place text check (birth_place is null or length(btrim(birth_place)) <= 100),
  birth_date date,
  address text check (address is null or length(address) <= 1000),
  guardian_name text check (guardian_name is null or length(btrim(guardian_name)) <= 150),
  guardian_phone text check (guardian_phone is null or length(btrim(guardian_phone)) <= 30),
  department_id uuid references public.departments(id) on delete restrict,
  enrollment_year smallint not null check (enrollment_year between 2000 and 2200),
  status text not null default 'active'
    check (status in ('active','graduated','transferred','withdrawn')),
  graduation_date date,
  notes text check (notes is null or length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  check (birth_date is null or birth_date <= current_date),
  check (graduation_date is null or graduation_date >= birth_date)
);

create index students_name_search_idx on public.students using gin (full_name extensions.gin_trgm_ops);
create index students_status_idx on public.students(status);
create index students_department_idx on public.students(department_id);
create index students_enrollment_year_idx on public.students(enrollment_year);

create table public.student_status_history (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.students(id) on delete restrict,
  old_status text,
  new_status text not null check (new_status in ('active','graduated','transferred','withdrawn')),
  changed_at timestamptz not null default now(),
  changed_by uuid references public.users(id) on delete set null
);

create index student_status_history_student_idx
  on public.student_status_history(student_id, changed_at desc);

create trigger students_updated_at before update on public.students
  for each row execute function public.set_updated_at();

create or replace function public.record_student_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.student_status_history(student_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.student_status_history(student_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

revoke all on function public.record_student_status_change() from public, anon, authenticated;
create trigger students_status_history
  after insert or update of status on public.students
  for each row execute function public.record_student_status_change();

alter table public.students enable row level security;
alter table public.student_status_history enable row level security;

revoke all on public.students, public.student_status_history from anon;
revoke truncate, references, trigger on public.students, public.student_status_history from authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select on public.student_status_history to authenticated;
grant usage, select on sequence public.student_status_history_id_seq to authenticated;

create policy students_select on public.students
  for select to authenticated using (public.has_permission('students:view'));
create policy students_insert on public.students
  for insert to authenticated with check (public.has_permission('students:create'));
create policy students_update on public.students
  for update to authenticated
  using (public.has_permission('students:update'))
  with check (public.has_permission('students:update'));
create policy students_delete on public.students
  for delete to authenticated using (public.has_permission('students:delete'));

create policy student_status_history_select on public.student_status_history
  for select to authenticated using (public.has_permission('students:view'));

comment on table public.students is
  'Data induk siswa privat. Tidak boleh diekspos melalui query atau route publik.';
comment on table public.student_status_history is
  'Riwayat perubahan status siswa yang ditulis otomatis oleh trigger.';
