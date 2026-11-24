\set ON_ERROR_STOP on

\echo '1. Bootstrap isolated Supabase-compatible PostgreSQL fixture'
\i tests/database/bootstrap.sql

\echo '2. Apply student and class migrations'
\i supabase/migrations/20261124250000_students_foundation.sql
\i supabase/migrations/20261124260000_academic_years_and_class_groups.sql
\i supabase/migrations/20261124270000_student_class_enrollment_audit_guard.sql
\i supabase/migrations/20261124280000_atomic_academic_year_activation.sql

\echo '3. Seed deterministic reference rows'
insert into public.users (id) values
  ('50000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002');
insert into public.departments (id)
values ('30000000-0000-4000-8000-000000000001');
insert into public.teachers (id)
values ('40000000-0000-4000-8000-000000000001');

insert into public.academic_years (id, name, start_date, end_date)
values
  ('10000000-0000-4000-8000-000000000001', '2026/2027', '2026-07-01', '2027-06-30'),
  ('10000000-0000-4000-8000-000000000002', '2027/2028', '2027-07-01', '2028-06-30');

insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'X TKJ 1', 10, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'X TKJ 2', 10, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'XI TKJ 1', 11, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001');

\echo '4. Verify grants and RLS deny anonymous/unpermitted reads'
do $$
begin
  if has_table_privilege('anon', 'public.students', 'select') then
    raise exception 'anon unexpectedly has SELECT on students';
  end if;
  if has_table_privilege('authenticated', 'public.students', 'select') is false then
    raise exception 'authenticated is missing the table SELECT grant';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', '', false);
set role authenticated;

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count from public.students;
  if visible_count <> 0 then
    raise exception 'RLS exposed students without permission: %', visible_count;
  end if;
end;
$$;

select set_config(
  'test.permissions',
  'students:view,students:create,students:update,classes:view,classes:create,classes:update',
  false
);

\echo '5. Verify student status history and private access'
do $$
declare
  history_count integer;
  actor_id uuid := '50000000-0000-4000-8000-000000000001';
begin
  insert into public.students (
    id, nis, nisn, full_name, gender, department_id, enrollment_year, status, created_by
  ) values
    ('60000000-0000-4000-8000-000000000001', 'NIS-001', '1234567890', 'Siswa Aktif Satu', 'male',
     '30000000-0000-4000-8000-000000000001', 2026, 'active', actor_id),
    ('60000000-0000-4000-8000-000000000002', 'NIS-002', '1234567891', 'Siswa Tidak Aktif', 'female',
     '30000000-0000-4000-8000-000000000001', 2026, 'withdrawn', actor_id),
    ('60000000-0000-4000-8000-000000000003', 'NIS-003', '1234567892', 'Siswa Aktif Dua', 'male',
     '30000000-0000-4000-8000-000000000001', 2026, 'active', actor_id);

  select count(*) into history_count
  from public.student_status_history
  where student_id = '60000000-0000-4000-8000-000000000001'
    and new_status = 'active'
    and changed_by = actor_id;
  if history_count <> 1 then
    raise exception 'Student insert did not create the expected status history';
  end if;

  update public.students
  set status = 'graduated'
  where id = '60000000-0000-4000-8000-000000000001';
  update public.students
  set status = 'active'
  where id = '60000000-0000-4000-8000-000000000001';

  select count(*) into history_count
  from public.student_status_history
  where student_id = '60000000-0000-4000-8000-000000000001';
  if history_count <> 3 then
    raise exception 'Expected 3 status history rows, got %', history_count;
  end if;
end;
$$;

\echo '6. Verify enrollment guards, trusted actor metadata, and class history'
do $$
declare
  v_enrollment_id uuid;
  actor_id uuid := '50000000-0000-4000-8000-000000000001';
  spoofed_actor uuid := '50000000-0000-4000-8000-000000000002';
  history_count integer;
  actual_actor uuid;
begin
  insert into public.student_class_enrollments (
    student_id, academic_year_id, class_group_id, assigned_by
  ) values (
    '60000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    spoofed_actor
  ) returning id into v_enrollment_id;

  select assigned_by into actual_actor
  from public.student_class_enrollments where id = v_enrollment_id;
  if actual_actor is distinct from actor_id then
    raise exception 'assigned_by was not replaced with auth.uid()';
  end if;

  update public.student_class_enrollments
  set class_group_id = '20000000-0000-4000-8000-000000000002'
  where id = v_enrollment_id;

  select count(*) into history_count
  from public.student_class_history
  where student_class_history.enrollment_id = v_enrollment_id;
  if history_count <> 2 then
    raise exception 'Expected insert and transfer history rows, got %', history_count;
  end if;

  begin
    update public.student_class_enrollments
    set student_id = '60000000-0000-4000-8000-000000000003'
    where id = v_enrollment_id;
    raise exception 'Expected immutable enrollment identity guard to reject update';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.student_class_enrollments
    set assigned_by = spoofed_actor
    where id = v_enrollment_id;
    raise exception 'Expected immutable assigned_by guard to reject update';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.student_class_enrollments (
      student_id, academic_year_id, class_group_id
    ) values (
      '60000000-0000-4000-8000-000000000003',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000003'
    );
    raise exception 'Expected mismatched academic year guard to reject enrollment';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.student_class_enrollments (
      student_id, academic_year_id, class_group_id
    ) values (
      '60000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001'
    );
    raise exception 'Expected inactive student guard to reject enrollment';
  exception when check_violation then
    null;
  end;
end;
$$;

\echo '7. Verify atomic academic-year activation and rollback'
do $$
declare
  active_id uuid;
  active_count integer;
begin
  active_id := public.activate_academic_year('10000000-0000-4000-8000-000000000001');
  if active_id <> '10000000-0000-4000-8000-000000000001' then
    raise exception 'Activation returned the wrong academic year';
  end if;

  begin
    perform public.activate_academic_year('10000000-0000-4000-8000-000000000099');
    raise exception 'Expected missing target to raise no_data_found';
  exception when no_data_found then
    null;
  end;

  select count(*) into active_count
  from public.academic_years where is_active;
  if active_count <> 1 then
    raise exception 'Failed activation did not roll back the previous active year';
  end if;

  select id into active_id
  from public.academic_years where is_active;
  if active_id <> '10000000-0000-4000-8000-000000000001' then
    raise exception 'Rollback did not preserve the previously active year';
  end if;

  active_id := public.activate_academic_year('10000000-0000-4000-8000-000000000002');
  if active_id <> '10000000-0000-4000-8000-000000000002' then
    raise exception 'Second activation returned the wrong academic year';
  end if;

  select count(*) into active_count
  from public.academic_years where is_active;
  if active_count <> 1 then
    raise exception 'Expected exactly one active academic year, got %', active_count;
  end if;
end;
$$;

select set_config('test.permissions', 'classes:view,students:view', false);
do $$
declare
  active_id uuid;
begin
  begin
    perform public.activate_academic_year('10000000-0000-4000-8000-000000000001');
    raise exception 'Expected activation without classes:update to be rejected';
  exception when insufficient_privilege then
    null;
  end;

  select id into active_id
  from public.academic_years where is_active;
  if active_id <> '10000000-0000-4000-8000-000000000002' then
    raise exception 'Permission denial changed the active academic year';
  end if;
end;
$$;

reset role;
\echo 'Database migration assertions passed.'
