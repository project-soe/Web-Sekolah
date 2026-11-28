-- Enforce attendance payload validation at the database RPC boundary as well as in the UI.
-- Existing clients keep the same function signature and valid payload behavior.
create or replace function public.save_class_attendance(p_class_group_id uuid,p_date date,p_entries jsonb)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_user uuid := (select auth.uid()); v_year uuid; v_session uuid; v_status text;
 item jsonb; v_student uuid; v_enrollment uuid; v_value text; v_note text; v_seen_students uuid[] := array[]::uuid[];
begin
 if not public.has_permission('attendance:take') then raise exception 'Tidak memiliki izin mencatat absensi' using errcode='42501'; end if;
 if p_date>(now() at time zone 'Asia/Jakarta')::date or p_date<(now() at time zone 'Asia/Jakarta')::date-7 then
  raise exception 'Tanggal absensi di luar rentang 7 hari' using errcode='22023'; end if;
 if jsonb_typeof(p_entries) is distinct from 'array' then raise exception 'Format absensi tidak valid' using errcode='22023'; end if;
 select cg.academic_year_id into v_year from public.class_groups cg where cg.id=p_class_group_id
 and (public.has_permission('attendance:view_all') or exists(select 1 from public.teacher_user_links tul
 where tul.teacher_id=cg.homeroom_teacher_id and tul.user_id=v_user)) for update;
 if not found then raise exception 'Kelas wali tidak ditemukan atau tidak diizinkan' using errcode='42501'; end if;
 insert into public.attendance_sessions(academic_year_id,class_group_id,attendance_date,created_by)
 values(v_year,p_class_group_id,p_date,v_user) on conflict(class_group_id,attendance_date) do nothing;
 select id,status into v_session,v_status from public.attendance_sessions where class_group_id=p_class_group_id and attendance_date=p_date for update;
 if v_status<>'draft' then raise exception 'Absensi sudah dikirim; koreksi hanya oleh admin' using errcode='55000'; end if;
 for item in select value from jsonb_array_elements(p_entries) loop
  if jsonb_typeof(item) is distinct from 'object' then
   raise exception 'Format entri absensi tidak valid' using errcode='22023';
  end if;
  v_student:=(item->>'student_id')::uuid;
  v_value:=nullif(item->>'status','');
  v_note:=nullif(coalesce(item->>'note',''),'');
  if v_student is null then raise exception 'ID siswa wajib diisi' using errcode='22023'; end if;
  if v_student = any(v_seen_students) then
   raise exception 'Siswa duplikat dalam payload absensi' using errcode='23514';
  end if;
  v_seen_students:=array_append(v_seen_students,v_student);
  if v_value is not null and v_value not in ('present','late','sick','excused','absent') then
   raise exception 'Status tidak valid' using errcode='23514';
  end if;
  if length(v_note)>500 then
   raise exception 'Catatan absensi maksimal 500 karakter' using errcode='22023';
  end if;
  select en.id into v_enrollment from public.student_class_enrollments en join public.students st on st.id=en.student_id
  where en.student_id=v_student and en.class_group_id=p_class_group_id and en.academic_year_id=v_year
  and en.ended_at is null and st.status='active' and st.archived_at is null;
  if not found then raise exception 'Siswa bukan anggota aktif rombel ini' using errcode='23514'; end if;
  if v_value is not null then
   insert into public.attendance_entries(session_id,student_id,enrollment_id,status,note,recorded_by)
   values(v_session,v_student,v_enrollment,v_value,v_note,v_user)
   on conflict(session_id,student_id) do update set status=excluded.status,note=excluded.note,recorded_by=v_user,recorded_at=now();
  end if;
 end loop;
 return v_session;
end $$;

