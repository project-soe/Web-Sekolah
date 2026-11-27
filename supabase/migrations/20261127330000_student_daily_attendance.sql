-- Absensi harian per rombel. Semua mutasi melalui RPC SECURITY DEFINER.
create table public.attendance_sessions (
 id uuid primary key default gen_random_uuid(),
 academic_year_id uuid not null references public.academic_years(id) on delete restrict,
 class_group_id uuid not null references public.class_groups(id) on delete restrict,
 attendance_date date not null,
 status text not null default 'draft' check(status in ('draft','submitted','locked')),
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 submitted_by uuid references public.users(id) on delete set null,
 submitted_at timestamptz,
 locked_by uuid references public.users(id) on delete set null,
 locked_at timestamptz,
 unique(class_group_id,attendance_date),
 check((status='draft' and submitted_at is null and locked_at is null)
    or (status='submitted' and submitted_at is not null and locked_at is null)
    or (status='locked' and submitted_at is not null and locked_at is not null))
);
create index attendance_sessions_date_idx on public.attendance_sessions(attendance_date desc,class_group_id);
create table public.attendance_entries (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.attendance_sessions(id) on delete restrict,
 student_id uuid not null references public.students(id) on delete restrict,
 enrollment_id uuid not null references public.student_class_enrollments(id) on delete restrict,
 status text not null check(status in ('present','late','sick','excused','absent')),
 note text check(note is null or length(note)<=500),
 recorded_by uuid references public.users(id) on delete set null,
 recorded_at timestamptz not null default now(),
 unique(session_id,student_id), unique(session_id,enrollment_id)
);
create index attendance_entries_student_idx on public.attendance_entries(student_id,session_id);
create table public.attendance_entry_history (
 id bigint generated always as identity primary key,
 entry_id uuid not null references public.attendance_entries(id) on delete restrict,
 old_status text not null, new_status text not null,
 old_note text, new_note text,
 reason text not null check(length(btrim(reason)) between 5 and 500),
 changed_by uuid references public.users(id) on delete set null,
 changed_at timestamptz not null default now()
);
create index attendance_history_entry_idx on public.attendance_entry_history(entry_id,changed_at desc);
alter table public.attendance_sessions enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.attendance_entry_history enable row level security;
revoke all on public.attendance_sessions,public.attendance_entries,public.attendance_entry_history from anon,authenticated;
revoke truncate,references,trigger on public.attendance_sessions,public.attendance_entries,public.attendance_entry_history from authenticated;

insert into public.permissions(code,module,action) values
 ('attendance:view_own_class','attendance','view_own_class'),
 ('attendance:take','attendance','take'),('attendance:submit','attendance','submit'),
 ('attendance:view_all','attendance','view_all'),('attendance:correct','attendance','correct'),
 ('attendance:lock','attendance','lock') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id)
 select r.id,p.id from public.roles r join public.permissions p on p.code in
 ('attendance:view_own_class','attendance:take','attendance:submit') where r.slug='guru'
 on conflict do nothing;
insert into public.role_permissions(role_id,permission_id)
 select r.id,p.id from public.roles r join public.permissions p on p.code in
 ('attendance:view_all','attendance:take','attendance:submit','attendance:correct','attendance:lock')
 where r.slug='admin_sekolah' on conflict do nothing;

create or replace function public.my_teacher_attendance_roster(p_date date default (now() at time zone 'Asia/Jakarta')::date)
returns table(class_group_id uuid,class_name text,academic_year text,attendance_date date,
 session_id uuid,session_status text,student_id uuid,nis text,full_name text,
 attendance_status text,attendance_note text)
language plpgsql stable security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid());
begin
 if not public.has_permission('attendance:view_own_class') and not public.has_permission('attendance:view_all') then
  raise exception 'Tidak memiliki izin melihat absensi' using errcode='42501';
 end if;
 if p_date>(now() at time zone 'Asia/Jakarta')::date or p_date<(now() at time zone 'Asia/Jakarta')::date-7 then
  raise exception 'Tanggal absensi di luar rentang 7 hari' using errcode='22023';
 end if;
 return query
 select cg.id,cg.name,ay.name,p_date,s.id,s.status,st.id,st.nis,st.full_name,e.status,e.note
 from public.class_groups cg join public.academic_years ay on ay.id=cg.academic_year_id
 join public.student_class_enrollments en on en.class_group_id=cg.id and en.academic_year_id=cg.academic_year_id and en.ended_at is null
 join public.students st on st.id=en.student_id and st.status='active' and st.archived_at is null
 left join public.attendance_sessions s on s.class_group_id=cg.id and s.attendance_date=p_date
 left join public.attendance_entries e on e.session_id=s.id and e.student_id=st.id
 where public.has_permission('attendance:view_all') or exists(
  select 1 from public.teacher_user_links tul where tul.teacher_id=cg.homeroom_teacher_id and tul.user_id=v_user)
 order by cg.name,st.full_name;
end $$;

create or replace function public.save_class_attendance(p_class_group_id uuid,p_date date,p_entries jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid()); v_year uuid; v_session uuid; v_status text;
 item jsonb; v_student uuid; v_enrollment uuid; v_value text; v_note text;
begin
 if not public.has_permission('attendance:take') then raise exception 'Tidak memiliki izin mencatat absensi' using errcode='42501'; end if;
 if p_date>(now() at time zone 'Asia/Jakarta')::date or p_date<(now() at time zone 'Asia/Jakarta')::date-7 then
  raise exception 'Tanggal absensi di luar rentang 7 hari' using errcode='22023'; end if;
 if jsonb_typeof(p_entries)<>'array' then raise exception 'Format absensi tidak valid' using errcode='22023'; end if;
 select cg.academic_year_id into v_year from public.class_groups cg where cg.id=p_class_group_id
 and (public.has_permission('attendance:view_all') or exists(select 1 from public.teacher_user_links tul
 where tul.teacher_id=cg.homeroom_teacher_id and tul.user_id=v_user)) for update;
 if not found then raise exception 'Kelas wali tidak ditemukan atau tidak diizinkan' using errcode='42501'; end if;
 insert into public.attendance_sessions(academic_year_id,class_group_id,attendance_date,created_by)
 values(v_year,p_class_group_id,p_date,v_user) on conflict(class_group_id,attendance_date) do nothing;
 select id,status into v_session,v_status from public.attendance_sessions where class_group_id=p_class_group_id and attendance_date=p_date for update;
 if v_status<>'draft' then raise exception 'Absensi sudah dikirim; koreksi hanya oleh admin' using errcode='55000'; end if;
 for item in select value from jsonb_array_elements(p_entries) loop
  v_student:=(item->>'student_id')::uuid; v_value:=nullif(item->>'status',''); v_note:=nullif(left(coalesce(item->>'note',''),500),'');
  select en.id into v_enrollment from public.student_class_enrollments en join public.students st on st.id=en.student_id
  where en.student_id=v_student and en.class_group_id=p_class_group_id and en.academic_year_id=v_year
  and en.ended_at is null and st.status='active' and st.archived_at is null;
  if not found then raise exception 'Siswa bukan anggota aktif rombel ini' using errcode='23514'; end if;
  if v_value is not null then
   if v_value not in ('present','late','sick','excused','absent') then raise exception 'Status tidak valid' using errcode='23514'; end if;
   insert into public.attendance_entries(session_id,student_id,enrollment_id,status,note,recorded_by)
   values(v_session,v_student,v_enrollment,v_value,v_note,v_user)
   on conflict(session_id,student_id) do update set status=excluded.status,note=excluded.note,recorded_by=v_user,recorded_at=now();
  end if;
 end loop;
 return v_session;
end $$;

create or replace function public.submit_class_attendance(p_session_id uuid)
returns void language plpgsql security definer set search_path=''
as $$
declare v_s public.attendance_sessions%rowtype; v_total int; v_done int;
begin
 if not public.has_permission('attendance:submit') then raise exception 'Tidak memiliki izin mengirim absensi' using errcode='42501'; end if;
 select * into v_s from public.attendance_sessions where id=p_session_id for update;
 if not found then raise exception 'Sesi tidak ditemukan' using errcode='P0002'; end if;
 if not public.has_permission('attendance:view_all') and not exists(select 1 from public.class_groups cg join public.teacher_user_links tul on tul.teacher_id=cg.homeroom_teacher_id where cg.id=v_s.class_group_id and tul.user_id=(select auth.uid())) then
  raise exception 'Tidak diizinkan mengirim absensi kelas ini' using errcode='42501'; end if;
 if v_s.status<>'draft' then raise exception 'Sesi bukan draft' using errcode='55000'; end if;
 select count(*) into v_total from public.student_class_enrollments en join public.students st on st.id=en.student_id
 where en.class_group_id=v_s.class_group_id and en.academic_year_id=v_s.academic_year_id and en.ended_at is null and st.status='active' and st.archived_at is null;
 select count(*) into v_done from public.attendance_entries where session_id=p_session_id;
 if v_total=0 or v_done<>v_total then raise exception 'Semua siswa harus memiliki status sebelum absensi dikirim' using errcode='23514'; end if;
 update public.attendance_sessions set status='submitted',submitted_by=(select auth.uid()),submitted_at=now() where id=p_session_id;
end $$;

create or replace function public.correct_attendance_entry(p_entry_id uuid,p_status text,p_note text,p_reason text)
returns void language plpgsql security definer set search_path=''
as $$
declare v_e public.attendance_entries%rowtype; v_s public.attendance_sessions%rowtype;
begin
 if not public.has_permission('attendance:correct') then raise exception 'Tidak memiliki izin koreksi' using errcode='42501'; end if;
 if p_status not in ('present','late','sick','excused','absent') or length(btrim(coalesce(p_reason,''))) not between 5 and 500 then
  raise exception 'Status atau alasan koreksi tidak valid' using errcode='22023'; end if;
 select * into v_e from public.attendance_entries where id=p_entry_id for update;
 if not found then raise exception 'Entri tidak ditemukan' using errcode='P0002'; end if;
 select * into v_s from public.attendance_sessions where id=v_e.session_id for update;
 if v_s.status='locked' then raise exception 'Buka kunci sesi sebelum koreksi' using errcode='55000'; end if;
 insert into public.attendance_entry_history(entry_id,old_status,new_status,old_note,new_note,reason,changed_by)
 values(v_e.id,v_e.status,p_status,v_e.note,p_note,p_reason,(select auth.uid()));
 update public.attendance_entries set status=p_status,note=nullif(left(coalesce(p_note,''),500),''),
 recorded_by=(select auth.uid()),recorded_at=now() where id=p_entry_id;
end $$;

create or replace function public.set_attendance_session_lock(p_session_id uuid,p_locked boolean,p_reason text default null)
returns void language plpgsql security definer set search_path=''
as $$
declare v_s public.attendance_sessions%rowtype;
begin
 if not public.has_permission('attendance:lock') then raise exception 'Tidak memiliki izin mengunci absensi' using errcode='42501'; end if;
 if not p_locked and length(btrim(coalesce(p_reason,''))) not between 5 and 500 then raise exception 'Alasan membuka kunci wajib diisi' using errcode='22023'; end if;
 select * into v_s from public.attendance_sessions where id=p_session_id for update;
 if not found then raise exception 'Sesi tidak ditemukan' using errcode='P0002'; end if;
 if p_locked then
  if v_s.status<>'submitted' then raise exception 'Hanya sesi terkirim dapat dikunci' using errcode='55000'; end if;
  update public.attendance_sessions set status='locked',locked_by=(select auth.uid()),locked_at=now() where id=p_session_id;
 else
  if v_s.status<>'locked' then raise exception 'Sesi tidak terkunci' using errcode='55000'; end if;
  update public.attendance_sessions set status='submitted',locked_by=null,locked_at=null where id=p_session_id;
  insert into public.attendance_entry_history(entry_id,old_status,new_status,old_note,new_note,reason,changed_by)
  select id,status,status,note,note,'Buka kunci sesi: '||left(p_reason,450),(select auth.uid()) from public.attendance_entries where session_id=p_session_id;
 end if;
end $$;

create or replace function public.my_student_attendance()
returns table(attendance_date date,class_name text,status text,note text)
language sql stable security definer set search_path=''
as $$
 select s.attendance_date,cg.name,e.status,e.note from public.student_portal_accounts spa
 join public.attendance_entries e on e.student_id=spa.student_id
 join public.attendance_sessions s on s.id=e.session_id and s.status in ('submitted','locked')
 join public.class_groups cg on cg.id=s.class_group_id where spa.user_id=(select auth.uid())
 order by s.attendance_date desc
$$;

revoke all on function public.my_teacher_attendance_roster(date),public.save_class_attendance(uuid,date,jsonb),
 public.submit_class_attendance(uuid),public.correct_attendance_entry(uuid,text,text,text),
 public.set_attendance_session_lock(uuid,boolean,text),public.my_student_attendance() from public,anon;
grant execute on function public.my_teacher_attendance_roster(date),public.save_class_attendance(uuid,date,jsonb),
 public.submit_class_attendance(uuid),public.correct_attendance_entry(uuid,text,text,text),
 public.set_attendance_session_lock(uuid,boolean,text),public.my_student_attendance() to authenticated;
comment on table public.attendance_sessions is 'Satu sesi absensi harian per rombel dan tanggal.';
comment on table public.attendance_entries is 'Status kehadiran siswa per sesi.';
comment on table public.attendance_entry_history is 'Audit koreksi absensi yang ditulis hanya melalui RPC.';
