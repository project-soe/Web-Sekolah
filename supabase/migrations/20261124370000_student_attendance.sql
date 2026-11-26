-- Absensi harian per rombongan belajar dengan snapshot roster dan audit koreksi.
create table public.academic_calendar_days (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  calendar_date date not null,
  day_type text not null check (day_type in ('school_day','holiday','special_school_day','special_holiday')),
  title text check (title is null or length(btrim(title)) <= 120),
  notes text check (notes is null or length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  unique (academic_year_id, calendar_date)
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  class_group_id uuid not null references public.class_groups(id) on delete restrict,
  attendance_date date not null,
  status text not null default 'draft' check (status in ('draft','finalized')),
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  finalized_at timestamptz,
  finalized_by uuid references public.users(id) on delete set null,
  unique (class_group_id, attendance_date),
  check ((status = 'draft' and finalized_at is null and finalized_by is null)
      or (status = 'finalized' and finalized_at is not null and finalized_by is not null))
);

create index attendance_sessions_date_idx
  on public.attendance_sessions(attendance_date desc, academic_year_id);
create index attendance_sessions_class_idx
  on public.attendance_sessions(class_group_id, attendance_date desc);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  enrollment_id uuid not null references public.student_class_enrollments(id) on delete restrict,
  class_group_id uuid not null references public.class_groups(id) on delete restrict,
  student_name_snapshot text not null,
  nis_snapshot text not null,
  status text check (status is null or status in ('present','late','sick','permitted','absent')),
  arrival_time time,
  notes text check (notes is null or length(notes) <= 1000),
  recorded_at timestamptz,
  recorded_by uuid references public.users(id) on delete set null,
  unique (session_id, student_id),
  check (arrival_time is null or status = 'late'),
  check ((status is null and recorded_at is null and recorded_by is null)
      or (status is not null and recorded_at is not null and recorded_by is not null))
);

create index attendance_records_student_idx
  on public.attendance_records(student_id, session_id);
create index attendance_records_session_idx
  on public.attendance_records(session_id, student_name_snapshot);

create table public.attendance_change_logs (
  id bigint generated always as identity primary key,
  attendance_record_id uuid not null references public.attendance_records(id) on delete restrict,
  old_values jsonb not null,
  new_values jsonb not null,
  reason text not null check (length(btrim(reason)) between 5 and 500),
  changed_at timestamptz not null default now(),
  changed_by uuid references public.users(id) on delete set null
);
create index attendance_change_logs_record_idx
  on public.attendance_change_logs(attendance_record_id, changed_at desc);

create trigger academic_calendar_days_updated_at
  before update on public.academic_calendar_days
  for each row execute function public.set_updated_at();

alter table public.academic_calendar_days enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_change_logs enable row level security;

revoke all on public.academic_calendar_days, public.attendance_sessions,
  public.attendance_records, public.attendance_change_logs from anon, authenticated;
revoke truncate, references, trigger on public.academic_calendar_days,
  public.attendance_sessions, public.attendance_records, public.attendance_change_logs
  from authenticated;
grant select on public.academic_calendar_days, public.attendance_sessions,
  public.attendance_records, public.attendance_change_logs to authenticated;

insert into public.permissions(code, module, action)
values
  ('attendance:view','attendance','view'),
  ('attendance:create','attendance','create'),
  ('attendance:update','attendance','update'),
  ('attendance:finalize','attendance','finalize'),
  ('attendance:correct','attendance','correct'),
  ('attendance:reports','attendance','reports'),
  ('attendance:calendar_manage','attendance','calendar_manage')
on conflict (code) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'attendance:view','attendance:create','attendance:update','attendance:finalize'
)
where r.slug = 'guru'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in (
  'attendance:view','attendance:correct','attendance:reports','attendance:calendar_manage'
)
where r.slug = 'admin_sekolah'
on conflict do nothing;

create or replace function public.is_homeroom_teacher(p_class_group_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $homeroom$
  select exists (
    select 1
    from public.teacher_user_links tul
    join public.class_groups cg on cg.homeroom_teacher_id = tul.teacher_id
    where tul.user_id = (select auth.uid()) and cg.id = p_class_group_id
  );
$homeroom$;
revoke all on function public.is_homeroom_teacher(uuid) from public, anon;
grant execute on function public.is_homeroom_teacher(uuid) to authenticated;

create or replace function public.can_access_attendance_class(p_class_group_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $access$
  select public.has_permission('attendance:reports')
    or (public.has_permission('attendance:view')
        and public.is_homeroom_teacher(p_class_group_id));
$access$;
revoke all on function public.can_access_attendance_class(uuid) from public, anon;
grant execute on function public.can_access_attendance_class(uuid) to authenticated;

create policy academic_calendar_days_select on public.academic_calendar_days
  for select to authenticated using (public.has_permission('attendance:view'));
create policy attendance_sessions_select on public.attendance_sessions
  for select to authenticated using (public.can_access_attendance_class(class_group_id));
create policy attendance_records_select on public.attendance_records
  for select to authenticated using (
    exists (
      select 1 from public.attendance_sessions s
      where s.id = attendance_records.session_id
        and public.can_access_attendance_class(s.class_group_id)
    )
  );
create policy attendance_change_logs_select on public.attendance_change_logs
  for select to authenticated using (
    public.has_permission('attendance:reports')
    or public.has_permission('attendance:correct')
  );

create or replace function public.save_academic_calendar_day(
  p_academic_year_id uuid,
  p_calendar_date date,
  p_day_type text,
  p_title text default null,
  p_notes text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $calendar$
declare
  v_day_id uuid;
  v_start date;
  v_end date;
begin
  if not public.has_permission('attendance:calendar_manage') then
    raise exception 'Tidak diizinkan mengelola kalender pendidikan' using errcode = '42501';
  end if;
  if p_calendar_date is null or p_day_type is null or p_day_type not in ('school_day','holiday','special_school_day','special_holiday')
    or (p_title is not null and length(btrim(p_title)) > 120)
    or (p_notes is not null and length(p_notes) > 1000) then
    raise exception 'Data kalender tidak valid' using errcode = '23514';
  end if;
  select start_date, end_date into v_start, v_end
  from public.academic_years where id = p_academic_year_id for share;
  if not found then raise exception 'Tahun ajaran tidak ditemukan' using errcode = 'P0002'; end if;
  if p_calendar_date < v_start or p_calendar_date > v_end then
    raise exception 'Tanggal di luar rentang tahun ajaran' using errcode = '23514';
  end if;
  -- Serialize calendar edits against session creation for the same date.
  perform 1 from public.academic_calendar_days
  where academic_year_id = p_academic_year_id and calendar_date = p_calendar_date
  for update;
  if p_day_type in ('holiday','special_holiday') and exists (
    select 1 from public.attendance_sessions
    where academic_year_id = p_academic_year_id and attendance_date = p_calendar_date
  ) then
    raise exception 'Tanggal sudah memiliki sesi absensi' using errcode = '23514';
  end if;

  insert into public.academic_calendar_days(
    academic_year_id, calendar_date, day_type, title, notes, created_by, updated_by
  ) values (
    p_academic_year_id, p_calendar_date, p_day_type, nullif(btrim(p_title), ''),
    nullif(btrim(p_notes), ''), (select auth.uid()), (select auth.uid())
  )
  on conflict (academic_year_id, calendar_date) do update
    set day_type = excluded.day_type,
        title = excluded.title,
        notes = excluded.notes,
        updated_by = (select auth.uid())
  returning id into v_day_id;
  return v_day_id;
end;
$calendar$;

create or replace function public.delete_academic_calendar_day(p_calendar_day_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $calendar_delete$
begin
  if not public.has_permission('attendance:calendar_manage') then
    raise exception 'Tidak diizinkan mengelola kalender pendidikan' using errcode = '42501';
  end if;
  perform 1 from public.academic_calendar_days where id = p_calendar_day_id for update;
  if exists (
    select 1 from public.attendance_sessions s
    join public.academic_calendar_days d
      on d.academic_year_id = s.academic_year_id and d.calendar_date = s.attendance_date
    where d.id = p_calendar_day_id
  ) then
    raise exception 'Tanggal kalender sudah dipakai sesi absensi' using errcode = '23514';
  end if;
  delete from public.academic_calendar_days where id = p_calendar_day_id;
end;
$calendar_delete$;

create or replace function public.my_homeroom_classes()
returns table (
  class_group_id uuid,
  class_name text,
  grade_level smallint,
  academic_year_id uuid,
  academic_year_name text,
  enrolled_count integer,
  capacity integer
)
language sql stable security definer set search_path = ''
as $my_classes$
  select cg.id, cg.name, cg.grade_level, ay.id, ay.name, cg.enrolled_count, cg.capacity
  from public.teacher_user_links tul
  join public.class_groups cg on cg.homeroom_teacher_id = tul.teacher_id
  join public.academic_years ay on ay.id = cg.academic_year_id
  where tul.user_id = (select auth.uid())
    and ay.is_active
    and public.has_permission('attendance:view')
  order by cg.grade_level, cg.name;
$my_classes$;

create or replace function public.create_attendance_session(p_class_group_id uuid, p_attendance_date date)
returns uuid
language plpgsql security definer set search_path = ''
as $create_session$
declare
  v_class record;
  v_session_id uuid;
  v_roster_count integer := 0;
  v_day_type text;
  v_boundary timestamptz;
begin
  if not public.has_permission('attendance:create')
    or not public.has_permission('attendance:view')
    or not public.is_homeroom_teacher(p_class_group_id) then
    raise exception 'Hanya wali kelas yang ditugaskan dapat membuat sesi absensi' using errcode = '42501';
  end if;
  if p_attendance_date is null then raise exception 'Tanggal absensi wajib diisi' using errcode = '22004'; end if;

  select cg.id, cg.academic_year_id, ay.start_date, ay.end_date, ay.is_active
  into v_class
  from public.class_groups cg
  join public.academic_years ay on ay.id = cg.academic_year_id
  where cg.id = p_class_group_id
  for share of cg, ay;
  if not found then raise exception 'Kelas tidak ditemukan' using errcode = 'P0002'; end if;
  if not v_class.is_active then
    raise exception 'Absensi hanya dapat dibuat pada tahun ajaran aktif' using errcode = '23514';
  end if;
  if p_attendance_date < v_class.start_date or p_attendance_date > v_class.end_date then
    raise exception 'Tanggal di luar tahun ajaran kelas' using errcode = '23514';
  end if;

  select day_type into v_day_type
  from public.academic_calendar_days
  where academic_year_id = v_class.academic_year_id
    and calendar_date = p_attendance_date
  for share;
  if v_day_type is null or v_day_type not in ('school_day','special_school_day') then
    raise exception 'Tanggal bukan hari sekolah pada kalender pendidikan' using errcode = '23514';
  end if;

  insert into public.attendance_sessions(academic_year_id, class_group_id, attendance_date, created_by)
  values (v_class.academic_year_id, p_class_group_id, p_attendance_date, (select auth.uid()))
  on conflict (class_group_id, attendance_date) do nothing
  returning id into v_session_id;

  if v_session_id is null then
    select id into v_session_id from public.attendance_sessions
    where class_group_id = p_class_group_id and attendance_date = p_attendance_date
    for update;
    return v_session_id;
  end if;
  v_boundary := ((p_attendance_date + 1)::timestamp at time zone 'Asia/Jakarta');

  insert into public.attendance_records(
    session_id, student_id, enrollment_id, class_group_id,
    student_name_snapshot, nis_snapshot
  )
  select v_session_id, e.student_id, e.id, p_class_group_id, s.full_name, s.nis
  from public.student_class_enrollments e
  join public.students s on s.id = e.student_id
  join lateral (
    select h.new_class_group_id
    from public.student_class_history h
    where h.enrollment_id = e.id and h.changed_at < v_boundary
    order by h.changed_at desc, h.id desc
    limit 1
  ) placement on placement.new_class_group_id = p_class_group_id
  join lateral (
    select sh.new_status
    from public.student_status_history sh
    where sh.student_id = e.student_id and sh.changed_at < v_boundary
    order by sh.changed_at desc, sh.id desc
    limit 1
  ) student_state on student_state.new_status = 'active'
  where e.academic_year_id = v_class.academic_year_id
    and e.assigned_at < v_boundary
    and (e.ended_at is null or e.ended_at > (p_attendance_date::timestamp at time zone 'Asia/Jakarta'));
  get diagnostics v_roster_count = row_count;
  if v_roster_count = 0 then
    raise exception 'Tidak ada siswa aktif pada rombel di tanggal tersebut' using errcode = 'P0002';
  end if;
  return v_session_id;
end;
$create_session$;

create or replace function public.get_attendance_session(p_class_group_id uuid, p_attendance_date date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $get_session$
declare v_result jsonb;
begin
  if not (public.has_permission('attendance:reports')
      or (public.has_permission('attendance:view') and public.is_homeroom_teacher(p_class_group_id))) then
    raise exception 'Tidak diizinkan melihat sesi absensi rombel ini' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'id', s.id,
    'attendance_date', s.attendance_date,
    'status', s.status,
    'class_group_id', s.class_group_id,
    'class_name', cg.name,
    'academic_year_name', ay.name,
    'finalized_at', s.finalized_at,
    'records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'student_id', r.student_id,
        'student_name', r.student_name_snapshot,
        'nis', r.nis_snapshot,
        'status', r.status,
        'arrival_time', r.arrival_time,
        'notes', r.notes,
        'recorded_at', r.recorded_at
      ) order by r.student_name_snapshot)
      from public.attendance_records r where r.session_id = s.id
    ), '[]'::jsonb)
  ) into v_result
  from public.attendance_sessions s
  join public.class_groups cg on cg.id = s.class_group_id
  join public.academic_years ay on ay.id = s.academic_year_id
  where s.class_group_id = p_class_group_id and s.attendance_date = p_attendance_date;
  if v_result is null then raise exception 'Sesi absensi belum dibuat' using errcode = 'P0002'; end if;
  return v_result;
end;
$get_session$;

create or replace function public.set_attendance_record(
  p_record_id uuid,
  p_status text,
  p_arrival_time time default null,
  p_notes text default null
)
returns void
language plpgsql security definer set search_path = ''
as $set_record$
declare v_record public.attendance_records%rowtype; v_session public.attendance_sessions%rowtype;
begin
  if not public.has_permission('attendance:update') then
    raise exception 'Tidak diizinkan mengisi absensi' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('present','late','sick','permitted','absent')
    or (p_notes is not null and length(p_notes) > 1000) then
    raise exception 'Data kehadiran tidak valid' using errcode = '23514';
  end if;
  select * into v_record from public.attendance_records where id = p_record_id for update;
  if not found then raise exception 'Data absensi tidak ditemukan' using errcode = 'P0002'; end if;
  if not public.is_homeroom_teacher(v_record.class_group_id) then
    raise exception 'Hanya wali kelas rombel yang dapat mengubah absensi' using errcode = '42501';
  end if;
  select * into v_session from public.attendance_sessions where id = v_record.session_id for update;
  if v_session.status <> 'draft' then
    raise exception 'Sesi sudah difinalisasi; gunakan prosedur koreksi' using errcode = '42501';
  end if;
  update public.attendance_records
  set status = p_status,
      arrival_time = case when p_status = 'late' then p_arrival_time else null end,
      notes = nullif(btrim(p_notes), ''),
      recorded_at = now(),
      recorded_by = (select auth.uid())
  where id = p_record_id;
end;
$set_record$;

create or replace function public.finalize_attendance_session(p_session_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $finalize$
declare v_session public.attendance_sessions%rowtype;
begin
  if not public.has_permission('attendance:finalize') then
    raise exception 'Tidak diizinkan memfinalisasi absensi' using errcode = '42501';
  end if;
  select * into v_session from public.attendance_sessions where id = p_session_id for update;
  if not found then raise exception 'Sesi absensi tidak ditemukan' using errcode = 'P0002'; end if;
  if not public.is_homeroom_teacher(v_session.class_group_id) then
    raise exception 'Hanya wali kelas rombel yang dapat memfinalisasi absensi' using errcode = '42501';
  end if;
  if v_session.status <> 'draft' then
    raise exception 'Sesi sudah difinalisasi' using errcode = '23514';
  end if;
  if not exists (select 1 from public.attendance_records where session_id = p_session_id) then
    raise exception 'Roster sesi absensi kosong' using errcode = '23514';
  end if;
  if exists (select 1 from public.attendance_records where session_id = p_session_id and status is null) then
    raise exception 'Semua siswa harus diberi status sebelum finalisasi' using errcode = '23514';
  end if;
  update public.attendance_sessions
  set status = 'finalized', finalized_at = now(), finalized_by = (select auth.uid())
  where id = p_session_id;
end;
$finalize$;

create or replace function public.my_attendance_records()
returns table (
  attendance_date date,
  class_name text,
  status text,
  arrival_time time,
  notes text
)
language sql stable security definer set search_path = ''
as $my_records$
  select s.attendance_date, cg.name, r.status, r.arrival_time, r.notes
  from public.student_portal_accounts spa
  join public.attendance_records r on r.student_id = spa.student_id
  join public.attendance_sessions s on s.id = r.session_id and s.status = 'finalized'
  join public.class_groups cg on cg.id = r.class_group_id
  where spa.user_id = (select auth.uid())
    and public.has_permission('student_portal:view')
  order by s.attendance_date desc
  limit 90;
$my_records$;

create or replace function public.correct_attendance_record(
  p_record_id uuid,
  p_new_status text,
  p_new_arrival_time time,
  p_new_notes text,
  p_reason text
)
returns void
language plpgsql security definer set search_path = ''
as $correct$
declare v_record public.attendance_records%rowtype; v_session public.attendance_sessions%rowtype;
begin
  if not public.has_permission('attendance:correct') then
    raise exception 'Tidak diizinkan mengoreksi absensi' using errcode = '42501';
  end if;
  if p_new_status is null or p_new_status not in ('present','late','sick','permitted','absent')
    or p_new_notes is not null and length(p_new_notes) > 1000
    or p_reason is null or length(btrim(p_reason)) < 5 or length(btrim(p_reason)) > 500 then
    raise exception 'Data koreksi tidak valid; alasan wajib diisi minimal 5 karakter' using errcode = '23514';
  end if;
  select * into v_record from public.attendance_records where id = p_record_id for update;
  if not found then raise exception 'Data absensi tidak ditemukan' using errcode = 'P0002'; end if;
  select * into v_session from public.attendance_sessions where id = v_record.session_id for update;
  if v_session.status <> 'finalized' then
    raise exception 'Koreksi hanya berlaku setelah sesi difinalisasi' using errcode = '23514';
  end if;

  update public.attendance_records
  set status = p_new_status,
      arrival_time = case when p_new_status = 'late' then p_new_arrival_time else null end,
      notes = nullif(btrim(p_new_notes), ''),
      recorded_at = now(),
      recorded_by = (select auth.uid())
  where id = p_record_id;

  insert into public.attendance_change_logs(attendance_record_id, old_values, new_values, reason, changed_by)
  values (
    p_record_id,
    jsonb_build_object('status', v_record.status, 'arrival_time', v_record.arrival_time, 'notes', v_record.notes),
    jsonb_build_object('status', p_new_status, 'arrival_time', case when p_new_status = 'late' then p_new_arrival_time else null end, 'notes', nullif(btrim(p_new_notes), '')),
    btrim(p_reason),
    (select auth.uid())
  );
end;
$correct$;

revoke all on function public.save_academic_calendar_day(uuid,date,text,text,text),
  public.delete_academic_calendar_day(uuid),
  public.create_attendance_session(uuid,date),
  public.get_attendance_session(uuid,date),
  public.set_attendance_record(uuid,text,time,text),
  public.finalize_attendance_session(uuid),
  public.correct_attendance_record(uuid,text,time,text,text),
  public.my_homeroom_classes(),
  public.my_attendance_records(),
  public.is_homeroom_teacher(uuid),
  public.can_access_attendance_class(uuid)
from public, anon;

grant execute on function public.save_academic_calendar_day(uuid,date,text,text,text),
  public.delete_academic_calendar_day(uuid) to authenticated;
grant execute on function public.create_attendance_session(uuid,date),
  public.get_attendance_session(uuid,date),
  public.set_attendance_record(uuid,text,time,text),
  public.finalize_attendance_session(uuid),
  public.correct_attendance_record(uuid,text,time,text,text),
  public.my_homeroom_classes(),
  public.my_attendance_records() to authenticated;

comment on table public.academic_calendar_days is
  'Kalender pendidikan per tahun ajaran; sesi absensi hanya dapat dibuat pada school_day atau special_school_day.';
comment on table public.attendance_sessions is
  'Satu sesi absensi per rombel per tanggal; roster dibekukan ketika sesi dibuat.';
comment on table public.attendance_records is
  'Snapshot siswa per sesi; status NULL berarti belum diisi dan tidak otomatis menjadi alpa.';
comment on table public.attendance_change_logs is
  'Audit trail koreksi setelah finalisasi, mencatat nilai lama/baru, alasan, aktor, dan waktu.';
