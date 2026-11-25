\set ON_ERROR_STOP on

\echo '1. Bootstrap isolated Supabase-compatible PostgreSQL fixture'
\i tests/database/bootstrap.sql

\echo '2. Apply student and class migrations'
\i supabase/migrations/20261124250000_students_foundation.sql
\i supabase/migrations/20261124260000_academic_years_and_class_groups.sql
\i supabase/migrations/20261124270000_student_class_enrollment_audit_guard.sql
\i supabase/migrations/20261124280000_atomic_academic_year_activation.sql
\i supabase/migrations/20261124290000_class_capacity_enrollment_guard.sql
\i supabase/migrations/20261124300000_bulk_class_promotion.sql
\i supabase/migrations/20261124310000_bulk_student_graduation.sql
\i supabase/migrations/20261124320000_student_lifecycle_column_guards.sql
\i supabase/migrations/20261124330000_student_transfer_withdrawal.sql
\i supabase/migrations/20261124340000_student_portal_account_onboarding.sql

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

insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'X TKJ 1', 10, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 36),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'X TKJ 2', 10, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 2),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'XI TKJ 1', 11, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1);

\echo '4. Verify grants and RLS deny anonymous/unpermitted reads'
do $$
begin
  if has_table_privilege('anon', 'public.students', 'select') then
    raise exception 'anon unexpectedly has SELECT on students';
  end if;
  if has_table_privilege('authenticated', 'public.students', 'select') is false then
    raise exception 'authenticated is missing the table SELECT grant';
  end if;
  if has_column_privilege('authenticated', 'public.students', 'status', 'INSERT')
    or has_column_privilege('authenticated', 'public.students', 'status', 'UPDATE')
    or has_column_privilege('authenticated', 'public.students', 'graduation_date', 'INSERT')
    or has_column_privilege('authenticated', 'public.students', 'graduation_date', 'UPDATE')
    or has_column_privilege('authenticated', 'public.students', 'created_by', 'INSERT')
    or has_column_privilege('authenticated', 'public.students', 'updated_by', 'UPDATE') then
    raise exception 'authenticated unexpectedly has direct lifecycle/audit column privileges';
  end if;
  if not has_column_privilege('authenticated', 'public.students', 'full_name', 'INSERT')
    or not has_column_privilege('authenticated', 'public.students', 'full_name', 'UPDATE') then
    raise exception 'authenticated is missing expected master-data column privileges';
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

\echo '5. Verify database-enforced student lifecycle and private access'
do $$
declare
  history_count integer;
  actor_id uuid := '50000000-0000-4000-8000-000000000001';
begin
  insert into public.students (
    id, nis, nisn, full_name, gender, department_id, enrollment_year
  ) values
    ('60000000-0000-4000-8000-000000000001', 'NIS-001', '1234567890', 'Siswa Aktif Satu', 'male',
     '30000000-0000-4000-8000-000000000001', 2026),
    ('60000000-0000-4000-8000-000000000002', 'NIS-002', '1234567891', 'Siswa Tidak Aktif', 'female',
     '30000000-0000-4000-8000-000000000001', 2026),
    ('60000000-0000-4000-8000-000000000003', 'NIS-003', '1234567892', 'Siswa Aktif Dua', 'male',
     '30000000-0000-4000-8000-000000000001', 2026),
    ('60000000-0000-4000-8000-000000000004', 'NIS-004', '1234567893', 'Siswa Aktif Tiga', 'female',
     '30000000-0000-4000-8000-000000000001', 2026),
    ('60000000-0000-4000-8000-000000000005', 'NIS-005', '1234567894', 'Siswa Aktif Empat', 'male',
     '30000000-0000-4000-8000-000000000001', 2026);

  if (select count(*) from public.students
      where id between '60000000-0000-4000-8000-000000000001'::uuid and '60000000-0000-4000-8000-000000000005'::uuid
        and status = 'active' and created_by = actor_id) <> 5 then
    raise exception 'Student inserts must default to active and trust auth.uid() for created_by';
  end if;

  select count(*) into history_count
  from public.student_status_history
  where student_id = '60000000-0000-4000-8000-000000000001'
    and new_status = 'active'
    and changed_by = actor_id;
  if history_count <> 1 then
    raise exception 'Student insert did not create the expected status history';
  end if;

  update public.students set notes = 'Perubahan data induk diizinkan'
  where id = '60000000-0000-4000-8000-000000000001';

  begin
    update public.students set status = 'graduated'
    where id = '60000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated direct status update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.students set graduation_date = '2026-05-15'
    where id = '60000000-0000-4000-8000-000000000001';
    raise exception 'Authenticated direct graduation-date update unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.students (nis, full_name, gender, enrollment_year, status)
    values ('NIS-DIRECT', 'Status Tidak Sah', 'male', 2026, 'graduated');
    raise exception 'Authenticated direct lifecycle insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
update public.students set status = 'withdrawn'
where id = '60000000-0000-4000-8000-000000000002';
update public.students set status = 'graduated'
where id = '60000000-0000-4000-8000-000000000001';
update public.students set status = 'active'
where id = '60000000-0000-4000-8000-000000000001';
set role authenticated;

do $$
declare history_count integer;
begin
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

  if (select enrolled_count from public.class_groups where id = '20000000-0000-4000-8000-000000000001') <> 0
    or (select enrolled_count from public.class_groups where id = '20000000-0000-4000-8000-000000000002') <> 1 then
    raise exception 'Enrollment counter did not follow the class transfer';
  end if;

  insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
  values ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');

  begin
    insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
    values ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002');
    raise exception 'Expected class capacity guard to reject an over-capacity enrollment';
  exception when check_violation then null;
  end;

  begin
    update public.class_groups set capacity = 1
    where id = '20000000-0000-4000-8000-000000000002';
    raise exception 'Expected capacity reduction below current enrollment to be rejected';
  exception when check_violation then null;
  end;

  if (select enrolled_count from public.class_groups where id = '20000000-0000-4000-8000-000000000002') <> 2 then
    raise exception 'Rejected over-capacity operations changed the counter';
  end if;

  update public.class_groups set enrolled_count = 0
  where id = '20000000-0000-4000-8000-000000000002';
  if (select enrolled_count from public.class_groups where id = '20000000-0000-4000-8000-000000000002') <> 2 then
    raise exception 'Direct client update unexpectedly changed the protected enrollment counter';
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

select set_config('test.permissions', 'classes:view,students:view,classes:update', false);
update public.class_groups set capacity = 1 where id = '20000000-0000-4000-8000-000000000003';
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

select set_config('test.permissions', 'classes:view,classes:create,classes:update,students:view,students:create,students:update', false);

insert into public.academic_years (id, name, start_date, end_date)
values ('10000000-0000-4000-8000-000000000003', '2028/2029', '2028-07-01', '2029-06-30');
insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity)
values
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'XI TKJ 2', 11, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 3),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000003', 'XII TKJ 2', 12, '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 2);
insert into public.student_class_enrollments(student_id, academic_year_id, class_group_id)
values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004'),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004');

do $$
declare promoted integer; target_count integer; history_count integer;
begin
  begin
    perform public.promote_class_students('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005');
    raise exception 'Expected capacity limit to roll back the whole promotion';
  exception when check_violation then null;
  end;
  select enrolled_count into target_count from public.class_groups where id='20000000-0000-4000-8000-000000000005';
  if target_count <> 0 then raise exception 'Failed promotion did not roll back target capacity reservations'; end if;
  update public.class_groups set capacity=3 where id='20000000-0000-4000-8000-000000000005';
  promoted := public.promote_class_students('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005');
  if promoted <> 3 then raise exception 'Expected 3 promoted students, got %', promoted; end if;
  select count(*) into target_count from public.student_class_enrollments
  where academic_year_id='10000000-0000-4000-8000-000000000003' and class_group_id='20000000-0000-4000-8000-000000000005';
  if target_count <> 3 then raise exception 'Expected all 3 students in target class, got %', target_count; end if;
  select count(*) into history_count from public.student_class_history
  where academic_year_id='10000000-0000-4000-8000-000000000003' and new_class_group_id='20000000-0000-4000-8000-000000000005';
  if history_count <> 3 then raise exception 'Expected promotion history for all 3 students, got %', history_count; end if;
  begin
    perform public.promote_class_students('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005');
    raise exception 'Expected duplicate target-year placements to be rejected';
  exception when unique_violation then null;
  end;
end;
$$;


\echo '9. Verify atomic bulk graduation for active grade-XII classes'
insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity)
values ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'XII TKJ 1', 12,
        '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 36);
insert into public.students (id, nis, nisn, full_name, gender, department_id, enrollment_year)
values
  ('60000000-0000-4000-8000-000000000006', 'NIS-006', '1234567895', 'Calon Lulusan Satu', 'male', '30000000-0000-4000-8000-000000000001', 2025),
  ('60000000-0000-4000-8000-000000000007', 'NIS-007', '1234567896', 'Calon Lulusan Dua', 'female', '30000000-0000-4000-8000-000000000001', 2025),
  ('60000000-0000-4000-8000-000000000008', 'NIS-008', '1234567897', 'Calon Lulusan Tiga', 'male', '30000000-0000-4000-8000-000000000001', 2025);
insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
values
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006');

do $$
declare graduated integer; history_count integer; still_active integer;
begin
  select count(*) into still_active from public.students
  where id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and status = 'active';
  if still_active <> 3 then raise exception 'Graduation fixture must start with 3 active students'; end if;

  perform set_config('test.permissions', 'classes:view,students:view,classes:update', false);
  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000006', '2027-05-15');
    raise exception 'Expected graduation without students:update to be rejected';
  exception when insufficient_privilege then null;
  end;
  select count(*) into still_active from public.students
  where id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and status = 'active';
  if still_active <> 3 then raise exception 'Permission denial changed student statuses'; end if;

  perform set_config('test.permissions', 'classes:view,students:view,classes:update,students:update', false);
  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000004', '2027-05-15');
    raise exception 'Expected a non-XII class to be rejected';
  exception when check_violation then null;
  end;

  update public.students set birth_date = '2027-06-01'
  where id = '60000000-0000-4000-8000-000000000008';
  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000006', '2027-05-15');
    raise exception 'Expected invalid graduation date to roll back the whole class';
  exception when check_violation then null;
  end;
  select count(*) into still_active from public.students
  where id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and status = 'active' and graduation_date is null;
  if still_active <> 3 then raise exception 'Failed graduation partially changed student records'; end if;
  update public.students set birth_date = null
  where id = '60000000-0000-4000-8000-000000000008';

  graduated := public.graduate_class_students('20000000-0000-4000-8000-000000000006', '2027-05-15');
  if graduated <> 3 then raise exception 'Expected 3 graduated students, got %', graduated; end if;
  select count(*) into still_active from public.students
  where id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and status = 'active';
  if still_active <> 0 then raise exception 'Some active students were not graduated'; end if;
  select count(*) into history_count from public.student_status_history
  where student_id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and new_status = 'graduated' and changed_by = '50000000-0000-4000-8000-000000000001';
  if history_count <> 3 then raise exception 'Expected 3 graduation status-history rows, got %', history_count; end if;
  if (select count(*) from public.students
      where id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
        and graduation_date = '2027-05-15') <> 3 then
    raise exception 'Graduation date was not saved for every student';
  end if;

  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000006', '2027-05-15');
    raise exception 'Expected repeat graduation with no active students to be rejected';
  exception when no_data_found then null;
  end;
end;
$$;



\echo '10. Verify transfer/withdrawal closes active placement without deleting history'
select set_config('test.permissions', 'students:view,students:create,students:update,classes:view,classes:update', false);
insert into public.students (id, nis, nisn, full_name, gender, department_id, enrollment_year)
values
  ('60000000-0000-4000-8000-000000000009', 'NIS-009', '1234567898', 'Siswa Pindah', 'male', '30000000-0000-4000-8000-000000000001', 2026),
  ('60000000-0000-4000-8000-000000000010', 'NIS-010', '1234567899', 'Siswa Mengundurkan Diri', 'female', '30000000-0000-4000-8000-000000000001', 2026);
insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
values
  ('60000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006'),
  ('60000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000006');

do $transfer_test$
declare closed integer; actor_id uuid := '50000000-0000-4000-8000-000000000001';
begin
  if has_column_privilege('authenticated', 'public.student_class_enrollments', 'ended_at', 'UPDATE')
    or has_column_privilege('authenticated', 'public.student_class_enrollments', 'ended_by', 'UPDATE')
    or has_column_privilege('authenticated', 'public.student_class_enrollments', 'updated_by', 'UPDATE') then
    raise exception 'Authenticated clients unexpectedly have direct enrollment closure/audit privileges';
  end if;
  if not has_column_privilege('authenticated', 'public.student_class_enrollments', 'class_group_id', 'UPDATE') then
    raise exception 'Authenticated clients lost permission to move active class placements';
  end if;
  begin
    update public.student_class_enrollments set ended_at = now()
    where student_id = '60000000-0000-4000-8000-000000000009';
    raise exception 'Direct enrollment closure unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  closed := public.transition_student_status('60000000-0000-4000-8000-000000000009', 'transferred');
  if closed <> 1 then raise exception 'Expected one closed placement for transfer, got %', closed; end if;
  closed := public.transition_student_status('60000000-0000-4000-8000-000000000010', 'withdrawn');
  if closed <> 1 then raise exception 'Expected one closed placement for withdrawal, got %', closed; end if;
  if (select count(*) from public.student_class_enrollments
      where student_id in ('60000000-0000-4000-8000-000000000009','60000000-0000-4000-8000-000000000010')
        and ended_at is not null and ended_by = actor_id) <> 2 then
    raise exception 'Transfer/withdrawal did not close both placements with trusted actor metadata';
  end if;
  if (select enrolled_count from public.class_groups where id = '20000000-0000-4000-8000-000000000006') <> 3 then
    raise exception 'Closed placements did not release exactly two class slots';
  end if;
  if (select count(*) from public.student_class_history
      where student_id in ('60000000-0000-4000-8000-000000000009','60000000-0000-4000-8000-000000000010')) <> 2 then
    raise exception 'Placement history was deleted or not retained';
  end if;
  if (select count(*) from public.student_status_history
      where student_id = '60000000-0000-4000-8000-000000000009' and new_status = 'transferred') <> 1
    or (select count(*) from public.student_status_history
      where student_id = '60000000-0000-4000-8000-000000000010' and new_status = 'withdrawn') <> 1 then
    raise exception 'Student status history was not recorded';
  end if;
end;
$transfer_test$;


\echo '11. Verify student portal invitations, self-registration approval, and isolated profile access'
reset role;
insert into public.users (id, email, full_name) values
  ('50000000-0000-4000-8000-000000000003', 'student-invite@example.test', 'Siswa Undangan'),
  ('50000000-0000-4000-8000-000000000004', 'student-self@example.test', 'Siswa Mandiri');
insert into auth.users (id, email) values
  ('50000000-0000-4000-8000-000000000003', 'student-invite@example.test'),
  ('50000000-0000-4000-8000-000000000004', 'student-self@example.test');
insert into public.students (id, nis, full_name, gender, birth_date, enrollment_year)
values
  ('60000000-0000-4000-8000-000000000011', 'PORTAL-INVITE', 'Siswa Undangan', 'male', '2009-01-02', 2026),
  ('60000000-0000-4000-8000-000000000012', 'PORTAL-SELF', 'Siswa Mandiri', 'female', '2009-03-04', 2026);

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:view,students:update', false);
set role authenticated;
select public.create_student_portal_invitation('60000000-0000-4000-8000-000000000011') as portal_invite_token \gset

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000003', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.claim_student_portal_invitation(:'portal_invite_token');

do $
begin
  if not (select is_active from public.users where id = '50000000-0000-4000-8000-000000000003') then
    raise exception 'Claimed invitation did not activate the linked user';
  end if;
  if not exists (
    select 1 from public.student_portal_accounts
    where user_id = '50000000-0000-4000-8000-000000000003'
      and student_id = '60000000-0000-4000-8000-000000000011'
  ) then raise exception 'Invitation did not link the expected student'; end if;
  if not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = '50000000-0000-4000-8000-000000000003' and r.slug = 'siswa'
  ) then raise exception 'Invitation did not assign the restricted student role'; end if;
  if has_table_privilege('authenticated', 'public.student_portal_accounts', 'insert')
    or has_table_privilege('authenticated', 'public.student_portal_registration_requests', 'insert')
    or has_table_privilege('authenticated', 'public.student_portal_invitations', 'insert') then
    raise exception 'Authenticated users unexpectedly have direct portal onboarding write privileges';
  end if;
end;
$;

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000004', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.submit_student_portal_registration('Siswa Mandiri', 'PORTAL-SELF', '2009-03-04');

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:view,students:update', false);
set role authenticated;
do $
declare request_id uuid;
begin
  select id into request_id from public.student_portal_registration_requests
  where user_id = '50000000-0000-4000-8000-000000000004';
  if request_id is null then raise exception 'Self-registration request was not created'; end if;
  if (select is_active from public.users where id = '50000000-0000-4000-8000-000000000004') then
    raise exception 'Self-registration activated the account before approval';
  end if;
  perform public.approve_student_portal_registration(request_id);
  if not (select is_active from public.users where id = '50000000-0000-4000-8000-000000000004') then
    raise exception 'Approved self-registration did not activate the user';
  end if;
  if not exists (
    select 1 from public.student_portal_accounts
    where user_id = '50000000-0000-4000-8000-000000000004'
      and student_id = '60000000-0000-4000-8000-000000000012'
  ) then raise exception 'Self-registration did not link the matching student'; end if;
  if (select status from public.student_portal_registration_requests where id = request_id) <> 'approved' then
    raise exception 'Approved request status was not persisted'; end if;
end;
$;

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000003', false);
select set_config('test.permissions', 'student_portal:view', false);
set role authenticated;
do $
declare profile jsonb;
begin
  profile := public.my_student_portal_profile();
  if profile ->> 'nis' <> 'PORTAL-INVITE' or profile ->> 'full_name' <> 'Siswa Undangan' then
    raise exception 'Portal profile did not return the linked student safe fields';
  end if;
  if profile ? 'address' or profile ? 'guardian_phone' or profile ? 'notes' or profile ? 'birth_date' then
    raise exception 'Portal profile exposed private student fields';
  end if;
end;
$;

reset role;
\echo 'Database migration assertions passed.'

