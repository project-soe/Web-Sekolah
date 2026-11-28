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
\i supabase/migrations/20261128100000_student_enrollment_permission_guards.sql
\i supabase/migrations/20261124340000_student_portal_account_onboarding.sql
\i supabase/migrations/20261124350000_student_portal_onboarding_account_state_guard.sql
\i supabase/migrations/20261124360000_teacher_account_invitations.sql
\i supabase/migrations/20261127300000_student_portal_invitation_email_binding.sql
\i supabase/migrations/20261127310000_student_portal_registration_identity_normalization.sql
\i supabase/migrations/20261127320000_student_archive.sql
\echo 'Verify archive migration is safe when archived_at already exists'
\i supabase/migrations/20261127320000_student_archive.sql
\i supabase/migrations/20261127330000_student_daily_attendance.sql
\i supabase/migrations/20261128090000_student_attendance_monthly_summary.sql

\echo '3. Seed deterministic reference rows'
insert into public.users (id) values
  ('50000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002');
insert into public.departments (id)
values ('30000000-0000-4000-8000-000000000001');
insert into public.teachers (id, email)
values ('40000000-0000-4000-8000-000000000001', 'teacher-invite@example.test');

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
    or not has_column_privilege('authenticated', 'public.students', 'full_name', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.students', 'email', 'INSERT')
    or not has_column_privilege('authenticated', 'public.students', 'email', 'UPDATE') then
    raise exception 'authenticated is missing expected master-data column privileges, including student email';
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

  insert into public.students (
    id, nis, nisn, full_name, gender, department_id, enrollment_year
  ) values
    ('60000000-0000-4000-8000-000000000019', 'NIS-019', '9876543219', 'Siswa Uji Kapasitas Satu', 'male',
     '30000000-0000-4000-8000-000000000001', 2026),
    ('60000000-0000-4000-8000-000000000020', 'NIS-020', '9876543220', 'Siswa Uji Kapasitas Dua', 'female',
     '30000000-0000-4000-8000-000000000001', 2026);

  insert into public.class_groups (
    id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity
  ) values (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'XI TKJ Concurrency', 11,
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001', 1
  );

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

\echo '6b. Verify individual enrollment writes require view and update permissions'
reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'classes:update,students:update', false);
set role authenticated;
do $$
declare
  affected_rows integer;
begin
  begin
    insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
    values ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001');
    raise exception 'Enrollment insert unexpectedly succeeded without view permissions';
  exception when insufficient_privilege then null;
  end;
  update public.student_class_enrollments set class_group_id = '20000000-0000-4000-8000-000000000001'
  where student_id = '60000000-0000-4000-8000-000000000001' and academic_year_id = '10000000-0000-4000-8000-000000000001';
  get diagnostics affected_rows = row_count;
  if affected_rows <> 0 then raise exception 'Unauthorized enrollment update affected % rows', affected_rows; end if;
end;
$$;
reset role;
do $$
begin
  if exists (select 1 from public.student_class_enrollments where student_id = '60000000-0000-4000-8000-000000000004' and academic_year_id = '10000000-0000-4000-8000-000000000001') then raise exception 'Unauthorized insert persisted'; end if;
  if not exists (select 1 from public.student_class_enrollments where student_id = '60000000-0000-4000-8000-000000000001' and academic_year_id = '10000000-0000-4000-8000-000000000001' and class_group_id = '20000000-0000-4000-8000-000000000002') then raise exception 'Unauthorized update changed class'; end if;
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

\echo 'Verify withdrawal closes active enrollment, releases capacity, and preserves history'
insert into public.students (id, nis, nisn, full_name, gender, department_id, enrollment_year)
values ('60000000-0000-4000-8000-000000000018', 'NIS-018', '9876543218', 'Siswa Uji Withdrawal', 'female', '30000000-0000-4000-8000-000000000001', 2027);
do $$
declare
  v_enrollment_id uuid;
  closed_count integer;
  history_count integer;
  v_actor_id uuid := '50000000-0000-4000-8000-000000000001';
begin
  insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
  values (
    '60000000-0000-4000-8000-000000000018',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003'
  ) returning id into v_enrollment_id;

  closed_count := public.transition_student_status(
    '60000000-0000-4000-8000-000000000018', 'withdrawn'
  );
  if closed_count <> 1 then
    raise exception 'Withdrawal should close exactly one active-year enrollment, got %', closed_count;
  end if;

  if (select status from public.students
      where id = '60000000-0000-4000-8000-000000000018') <> 'withdrawn' then
    raise exception 'Withdrawal did not update the student status';
  end if;

  if not exists (
    select 1 from public.student_class_enrollments
    where id = v_enrollment_id and ended_at is not null and ended_by = v_actor_id
  ) then
    raise exception 'Withdrawal did not retain and close the enrollment with the trusted actor';
  end if;

  if (select enrolled_count from public.class_groups
      where id = '20000000-0000-4000-8000-000000000003') <> 0 then
    raise exception 'Withdrawal did not release the class capacity slot';
  end if;

  select count(*) into history_count
  from public.student_class_history where student_class_history.enrollment_id = v_enrollment_id;
  if history_count <> 1 then
    raise exception 'Withdrawal should preserve the original enrollment history, got % rows', history_count;
  end if;

  select count(*) into history_count
  from public.student_status_history
  where student_id = '60000000-0000-4000-8000-000000000018'
    and old_status = 'active' and new_status = 'withdrawn' and changed_by = v_actor_id;
  if history_count <> 1 then
    raise exception 'Withdrawal did not create the expected status audit history';
  end if;

  begin
    perform public.transition_student_status(
      '60000000-0000-4000-8000-000000000018', 'withdrawn'
    );
    raise exception 'Repeated withdrawal unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

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


-- Additional negative-path coverage for bulk promotion invariants.
insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity)
values
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'XI TKJ Wrong Level', 11,
   '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 10),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'XII TKJ Wrong Year', 12,
   '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 10);

do $promotion_guards$
declare target_count integer;
begin
  perform set_config('test.permissions', 'classes:view,students:view,classes:update', false);
  begin
    perform public.promote_class_students(
      '20000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000008'
    );
    raise exception 'Bulk promotion unexpectedly succeeded without students:update';
  exception when insufficient_privilege then null;
  end;

  perform set_config('test.permissions',
    'classes:view,students:view,classes:update,students:update', false);

  begin
    perform public.promote_class_students(
      '20000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000008'
    );
    raise exception 'Bulk promotion unexpectedly accepted a target at the same grade';
  exception when check_violation then null;
  end;

  begin
    perform public.promote_class_students(
      '20000000-0000-4000-8000-000000000004',
      '20000000-0000-4000-8000-000000000009'
    );
    raise exception 'Bulk promotion unexpectedly accepted a target in the same academic year';
  exception when check_violation then null;
  end;

  begin
    perform public.promote_class_students(
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000003'
    );
    raise exception 'Bulk promotion unexpectedly accepted a source from an inactive academic year';
  exception when check_violation then null;
  end;

  select count(*) into target_count
  from public.student_class_enrollments
  where academic_year_id = '10000000-0000-4000-8000-000000000003'
    and class_group_id = '20000000-0000-4000-8000-000000000005';
  if target_count <> 3 then
    raise exception 'Rejected promotion attempts changed valid target placements: %', target_count;
  end if;

  if exists (
    select 1 from public.student_class_enrollments
    where academic_year_id = '10000000-0000-4000-8000-000000000003'
      and class_group_id = '20000000-0000-4000-8000-000000000008'
  ) then
    raise exception 'Rejected promotion left partial placements in the invalid target class';
  end if;
end;
$promotion_guards$;

\echo '9. Verify atomic bulk graduation for active grade-XII classes'
insert into public.class_groups (id, academic_year_id, name, grade_level, department_id, homeroom_teacher_id, capacity)
values
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'XII TKJ 1', 12,
   '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 36),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'XII TKJ Inactive Year', 12,
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

do $graduation_guards$
declare
  graduated integer;
  history_count integer;
  still_active integer;
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
    and status = 'active' and graduation_date is null;
  if still_active <> 3 then raise exception 'Permission denial changed student lifecycle data'; end if;

  perform set_config('test.permissions', 'classes:view,students:view,classes:update,students:update', false);
  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000004', '2027-05-15');
    raise exception 'Expected a non-XII class to be rejected';
  exception when check_violation then null;
  end;

  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000010', '2027-05-15');
    raise exception 'Expected a class from an inactive academic year to be rejected';
  exception when check_violation then null;
  end;

  begin
    perform public.graduate_class_students('20000000-0000-4000-8000-000000000006', null);
    raise exception 'Expected a null graduation date to be rejected';
  exception when null_value_not_allowed then null;
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
  select count(*) into history_count from public.student_status_history
  where student_id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and new_status = 'graduated';
  if history_count <> 0 then raise exception 'Rejected graduation left partial status-history rows'; end if;
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
  select count(*) into history_count from public.student_status_history
  where student_id in ('60000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000007','60000000-0000-4000-8000-000000000008')
    and new_status = 'graduated';
  if history_count <> 3 then raise exception 'Repeat graduation duplicated status-history rows'; end if;
end;
$graduation_guards$;


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
update public.students set email = 'student-invite@example.test'
where id = '60000000-0000-4000-8000-000000000011';
select public.create_student_portal_invitation('60000000-0000-4000-8000-000000000011') as portal_invite_token \gset

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000003', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.claim_student_portal_invitation(:'portal_invite_token');

reset role;
do $portal$
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
$portal$;

reset role;
update public.students
set full_name = '  SISWA   MANDIRI  ', nis = ' PORTAL-SELF '
where id = '60000000-0000-4000-8000-000000000012';
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000004', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.submit_student_portal_registration('Siswa Mandiri', 'PORTAL-SELF', '2009-03-04');

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:view,students:update', false);
set role authenticated;
select public.approve_student_portal_registration(id)
from public.student_portal_registration_requests
where user_id = '50000000-0000-4000-8000-000000000004';

reset role;
do $portal$
begin
  if not (select is_active from public.users where id = '50000000-0000-4000-8000-000000000004') then
    raise exception 'Approved self-registration did not activate the user';
  end if;
  if not exists (
    select 1 from public.student_portal_accounts
    where user_id = '50000000-0000-4000-8000-000000000004'
      and student_id = '60000000-0000-4000-8000-000000000012'
  ) then raise exception 'Self-registration did not link the matching student'; end if;
  if (select status from public.student_portal_registration_requests
      where user_id = '50000000-0000-4000-8000-000000000004') <> 'approved' then
    raise exception 'Approved request status was not persisted'; end if;
end;
$portal$;

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000003', false);
select set_config('test.permissions', 'student_portal:view', false);
set role authenticated;
do $portal$
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
$portal$;

reset role;


\echo '12. Verify onboarding rejects Auth accounts that became active before claim or approval'
reset role;
insert into public.users (id, email, full_name, is_active) values
  ('50000000-0000-4000-8000-000000000005', 'already-active-claim@example.test', 'Akun Sudah Aktif', true),
  ('50000000-0000-4000-8000-000000000006', 'already-active-approval@example.test', 'Akun Approval Aktif', false);
insert into auth.users (id, email) values
  ('50000000-0000-4000-8000-000000000005', 'already-active-claim@example.test'),
  ('50000000-0000-4000-8000-000000000006', 'already-active-approval@example.test');
insert into public.students (id, nis, full_name, gender, birth_date, enrollment_year)
values
  ('60000000-0000-4000-8000-000000000013', 'PORTAL-ACTIVE-CLAIM', 'Siswa Akun Aktif', 'male', '2009-05-06', 2026),
  ('60000000-0000-4000-8000-000000000014', 'PORTAL-ACTIVE-APPROVAL', 'Siswa Approval Aktif', 'female', '2009-07-08', 2026);

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:view,students:update', false);
set role authenticated;
update public.students set email = 'already-active-claim@example.test'
where id = '60000000-0000-4000-8000-000000000013';
select public.create_student_portal_invitation('60000000-0000-4000-8000-000000000013') as active_claim_token \gset
select set_config('test.portal_active_claim_token', :'active_claim_token', false);

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000005', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $portal_hardening$
begin
  begin
    perform public.claim_student_portal_invitation(current_setting('test.portal_active_claim_token'));
    raise exception 'Active Auth account unexpectedly claimed a student invitation';
  exception when insufficient_privilege then null;
  end;
end;
$portal_hardening$;

reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000006', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.submit_student_portal_registration(
  'Siswa Approval Aktif', 'PORTAL-ACTIVE-APPROVAL', '2009-07-08'
);

select set_config('request.jwt.claim.sub', '', false);
reset role;
update public.users set is_active = true
where id = '50000000-0000-4000-8000-000000000006';
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:view,students:update', false);
set role authenticated;
do $portal_hardening$
declare request_id uuid;
begin
  select id into request_id from public.student_portal_registration_requests
  where user_id = '50000000-0000-4000-8000-000000000006';
  begin
    perform public.approve_student_portal_registration(request_id);
    raise exception 'Already-active Auth account unexpectedly passed admin approval';
  exception when insufficient_privilege then null;
  end;
end;
$portal_hardening$;

reset role;
do $portal_hardening$
begin
  if exists (select 1 from public.student_portal_accounts
      where user_id in ('50000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000006')) then
    raise exception 'Rejected active Auth account was unexpectedly linked';
  end if;
  if (select status from public.student_portal_registration_requests
      where user_id = '50000000-0000-4000-8000-000000000006') <> 'pending' then
    raise exception 'Rejected active Auth account request should remain pending';
  end if;
  if exists (select 1 from public.student_portal_invitations
      where student_id = '60000000-0000-4000-8000-000000000013' and claimed_at is not null) then
    raise exception 'Rejected active Auth account consumed the invitation';
  end if;
end;
$portal_hardening$;


\echo '13. Verify teacher invitation, verified email, one-time claim, and private account link'
reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'teacher_accounts:manage', false);
set role authenticated;
select public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000001') as teacher_invite_token \gset
select set_config('test.teacher_invite_token', :'teacher_invite_token', false);

reset role;
set role anon;
do $teacher_validation$
begin
  if not public.validate_teacher_account_invitation(
    current_setting('test.teacher_invite_token'), 'teacher-invite@example.test'
  ) then raise exception 'Valid teacher invitation/email pair was rejected'; end if;
  if public.validate_teacher_account_invitation(
    current_setting('test.teacher_invite_token'), 'wrong-email@example.test'
  ) then raise exception 'Teacher invitation accepted a mismatched email'; end if;
end;
$teacher_validation$;
reset role;
insert into public.users (id, email, full_name, is_active) values
  ('50000000-0000-4000-8000-000000000007', 'teacher-invite@example.test', 'Guru Undangan', false);
insert into auth.users (id, email, email_confirmed_at) values
  ('50000000-0000-4000-8000-000000000007', 'teacher-invite@example.test', now());

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000007', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_preclaim$
begin
  begin
    update public.users set is_active = true
    where id = '50000000-0000-4000-8000-000000000007';
    raise exception 'Unlinked teacher account unexpectedly activated itself';
  exception when insufficient_privilege then null;
  end;
end;
$teacher_preclaim$;
reset role;
do $teacher_preclaim_state$
begin
  if (select is_active from public.users where id = '50000000-0000-4000-8000-000000000007') then
    raise exception 'Rejected pre-claim activation changed the user active state';
  end if;
end;
$teacher_preclaim_state$;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000007', false);
select set_config('test.permissions', '', false);
set role authenticated;
select public.claim_teacher_account_invitation(current_setting('test.teacher_invite_token'));

reset role;
do $teacher_invite$
begin
  if not (select is_active from public.users where id = '50000000-0000-4000-8000-000000000007') then
    raise exception 'Claimed teacher invitation did not activate the account';
  end if;
  if not exists (
    select 1 from public.teacher_user_links
    where teacher_id = '40000000-0000-4000-8000-000000000001'
      and user_id = '50000000-0000-4000-8000-000000000007'
  ) then raise exception 'Teacher invitation did not create the private teacher-user link'; end if;
  if not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = '50000000-0000-4000-8000-000000000007' and r.slug = 'guru'
  ) then raise exception 'Teacher invitation did not assign the guru role'; end if;
  if has_table_privilege('authenticated', 'public.teacher_user_links', 'insert')
    or has_table_privilege('authenticated', 'public.teacher_account_invitations', 'insert') then
    raise exception 'Authenticated users unexpectedly have direct teacher-link/invitation write privileges';
  end if;
  if (select claimed_at from public.teacher_account_invitations
      where token_hash = extensions.digest(convert_to(current_setting('test.teacher_invite_token'), 'UTF8'), 'sha256')) is null then
    raise exception 'Teacher invitation token was not consumed';
  end if;
end;
$teacher_invite$;

reset role;


reset role;
insert into public.students (id, nis, nisn, full_name, gender, department_id, enrollment_year)
values ('60000000-0000-4000-8000-000000000021', 'ARCHIVE-ENROLL-021', '9876543221',
        'Siswa Uji Arsip dengan Penempatan', 'male',
        '30000000-0000-4000-8000-000000000001', 2026);
insert into public.student_class_enrollments (student_id, academic_year_id, class_group_id)
values ('60000000-0000-4000-8000-000000000021',
        '10000000-0000-4000-8000-000000000002',
        '20000000-0000-4000-8000-000000000003');

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions',
  'classes:view,students:view,classes:update,students:update,students:delete', false);
set role authenticated;
do $student_archive_guards$
begin
  begin
    perform public.archive_student('60000000-0000-4000-8000-000000000021');
    raise exception 'Student with an active class placement was unexpectedly archived';
  exception when check_violation then null;
  end;
  begin
    perform public.archive_student('60000000-0000-4000-8000-000000000011');
    raise exception 'Student with a linked Portal account was unexpectedly archived';
  exception when check_violation then null;
  end;
  begin
    perform public.archive_student('60000000-0000-4000-8000-000000000013');
    raise exception 'Student with an unexpired invitation was unexpectedly archived';
  exception when check_violation then null;
  end;
end;
$student_archive_guards$;

-- Close the student's active placement through the lifecycle RPC before archiving.
select public.transition_student_status(
  '60000000-0000-4000-8000-000000000021', 'withdrawn'
);
select set_config('test.permissions', 'students:delete', false);
select public.archive_student('60000000-0000-4000-8000-000000000021');

reset role;
do $student_archive_guards$
begin
  if (select archived_at is null from public.students
      where id = '60000000-0000-4000-8000-000000000021') then
    raise exception 'Student was not archived after its active placement was closed';
  end if;
  if not exists (
    select 1 from public.student_class_enrollments
    where student_id = '60000000-0000-4000-8000-000000000021'
      and ended_at is not null and ended_by = '50000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Archiving removed or failed to retain the closed enrollment';
  end if;
  if (select enrolled_count from public.class_groups
      where id = '20000000-0000-4000-8000-000000000003') <> 0 then
    raise exception 'Closing the placement did not release the class capacity slot';
  end if;
  if not exists (
    select 1 from public.student_class_history
    where student_id = '60000000-0000-4000-8000-000000000021'
  ) then
    raise exception 'Archiving removed the student class history';
  end if;
end;
$student_archive_guards$;

\echo '13b. Verify teacher invitation revocation, expiry, verified email, and existing-role guards'
reset role;
insert into public.teachers (id, email) values
  ('40000000-0000-4000-8000-000000000002', 'teacher-revoked@example.test'),
  ('40000000-0000-4000-8000-000000000003', 'teacher-expired@example.test'),
  ('40000000-0000-4000-8000-000000000004', 'teacher-unverified@example.test'),
  ('40000000-0000-4000-8000-000000000005', 'teacher-existing-role@example.test');

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'teacher_accounts:manage', false);
set role authenticated;
select public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000002') as revoked_teacher_token \gset
select set_config('test.teacher_revoked_token', :'revoked_teacher_token', false);
select public.revoke_teacher_account_invitation('40000000-0000-4000-8000-000000000002');
select public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000003') as expired_teacher_token \gset
select set_config('test.teacher_expired_token', :'expired_teacher_token', false);
select public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000004') as unverified_teacher_token \gset
select set_config('test.teacher_unverified_token', :'unverified_teacher_token', false);
select public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000005') as role_teacher_token \gset
select set_config('test.teacher_role_token', :'role_teacher_token', false);
reset role;

update public.teacher_account_invitations
set expires_at = now() - interval '1 minute'
where token_hash = extensions.digest(
  convert_to(current_setting('test.teacher_expired_token'), 'UTF8'), 'sha256'
);

set role anon;
do $teacher_invitation_invalid$
begin
  if public.validate_teacher_account_invitation(
    current_setting('test.teacher_revoked_token'), 'teacher-revoked@example.test'
  ) then raise exception 'Revoked teacher invitation was still valid'; end if;
  if public.validate_teacher_account_invitation(
    current_setting('test.teacher_expired_token'), 'teacher-expired@example.test'
  ) then raise exception 'Expired teacher invitation was still valid'; end if;
end;
$teacher_invitation_invalid$;
reset role;

insert into public.users (id, email, full_name, is_active) values
  ('50000000-0000-4000-8000-000000000008', 'teacher-revoked@example.test', 'Guru Dicabut', false),
  ('50000000-0000-4000-8000-000000000009', 'teacher-expired@example.test', 'Guru Kedaluwarsa', false),
  ('50000000-0000-4000-8000-000000000010', 'teacher-unverified@example.test', 'Guru Belum Verifikasi', false),
  ('50000000-0000-4000-8000-000000000011', 'teacher-existing-role@example.test', 'Guru Sudah Ber-role', false);
insert into auth.users (id, email, email_confirmed_at) values
  ('50000000-0000-4000-8000-000000000008', 'teacher-revoked@example.test', now()),
  ('50000000-0000-4000-8000-000000000009', 'teacher-expired@example.test', now()),
  ('50000000-0000-4000-8000-000000000010', 'teacher-unverified@example.test', null),
  ('50000000-0000-4000-8000-000000000011', 'teacher-existing-role@example.test', now());
insert into public.roles (slug, name, is_system)
values ('teacher_invitation_test_role', 'Teacher invitation test role', false)
on conflict (slug) do nothing;
insert into public.user_roles (user_id, role_id, assigned_by)
select '50000000-0000-4000-8000-000000000011', id, '50000000-0000-4000-8000-000000000001'
from public.roles where slug = 'teacher_invitation_test_role';
do $teacher_existing_role_seed$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = '50000000-0000-4000-8000-000000000011'
  ) then
    raise exception 'Existing-role fixture was not inserted';
  end if;
end;
$teacher_existing_role_seed$;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000008', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_invitation_rejected$
begin
  begin
    perform public.claim_teacher_account_invitation(current_setting('test.teacher_revoked_token'));
    raise exception 'Revoked teacher invitation was unexpectedly claimed';
  exception when no_data_found then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000009', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_invitation_rejected$
begin
  begin
    perform public.claim_teacher_account_invitation(current_setting('test.teacher_expired_token'));
    raise exception 'Expired teacher invitation was unexpectedly claimed';
  exception when no_data_found then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000010', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_invitation_rejected$
begin
  begin
    perform public.claim_teacher_account_invitation(current_setting('test.teacher_unverified_token'));
    raise exception 'Unverified teacher email was unexpectedly accepted';
  exception when insufficient_privilege then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000011', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_existing_role_fixture$
begin
  if auth.uid() is distinct from '50000000-0000-4000-8000-000000000011'::uuid then
    raise exception 'Existing-role fixture JWT subject mismatch: %', auth.uid();
  end if;
end;
$teacher_existing_role_fixture$;

do $teacher_invitation_rejected$
begin
  begin
    perform public.claim_teacher_account_invitation(current_setting('test.teacher_role_token'));
    raise exception 'Account with an existing role unexpectedly claimed a teacher invitation';
  exception when insufficient_privilege then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000007', false);
select set_config('test.permissions', '', false);
set role authenticated;
do $teacher_invitation_rejected$
begin
  begin
    perform public.claim_teacher_account_invitation(current_setting('test.teacher_invite_token'));
    raise exception 'Previously claimed teacher invitation was unexpectedly reusable';
  exception when no_data_found then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'teacher_accounts:manage', false);
set role authenticated;
do $teacher_invitation_rejected$
begin
  begin
    perform public.create_teacher_account_invitation('40000000-0000-4000-8000-000000000001');
    raise exception 'Already-linked teacher profile unexpectedly received another invitation';
  exception when unique_violation then null;
  end;
end;
$teacher_invitation_rejected$;
reset role;

do $teacher_invitation_rejected$
begin
  if exists (select 1 from public.teacher_user_links
      where teacher_id in ('40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003',
                           '40000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000005')) then
    raise exception 'Rejected teacher invitation created an account link';
  end if;
  if exists (select 1 from public.teacher_account_invitations
      where token_hash in (
        extensions.digest(convert_to(current_setting('test.teacher_unverified_token'), 'UTF8'), 'sha256'),
        extensions.digest(convert_to(current_setting('test.teacher_role_token'), 'UTF8'), 'sha256')
      ) and claimed_at is not null) then
    raise exception 'Rejected unverified/existing-role account consumed its invitation';
  end if;
  if (select count(*) from public.teacher_account_invitations
      where token_hash = extensions.digest(convert_to(current_setting('test.teacher_revoked_token'), 'UTF8'), 'sha256')
        and revoked_at is not null and claimed_at is null) <> 1 then
    raise exception 'Revoked invitation state was not retained';
  end if;
end;
$teacher_invitation_rejected$;


\echo '14. Verify safe student archiving and restoration'
reset role;
insert into public.students (id, nis, full_name, gender, enrollment_year)
values ('60000000-0000-4000-8000-000000000015', 'ARCHIVE-001', 'Siswa Arsip', 'male', 2026);

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:delete', false);
set role authenticated;
select public.archive_student('60000000-0000-4000-8000-000000000015');

reset role;
do $student_archive$
begin
  if (select archived_at is null from public.students where id = '60000000-0000-4000-8000-000000000015') then
    raise exception 'Archive RPC did not mark the student as archived';
  end if;
  if not exists (select 1 from public.student_status_history where student_id = '60000000-0000-4000-8000-000000000015') then
    raise exception 'Archiving unexpectedly removed student status history';
  end if;
end;
$student_archive$;

select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
select set_config('test.permissions', 'students:update', false);
set role authenticated;
select public.restore_archived_student('60000000-0000-4000-8000-000000000015');

reset role;
do $student_archive$
begin
  if (select archived_at is not null from public.students where id = '60000000-0000-4000-8000-000000000015') then
    raise exception 'Restore RPC did not clear archived_at';
  end if;
  if (select count(*) from public.student_status_history where student_id = '60000000-0000-4000-8000-000000000015') <> 1 then
    raise exception 'Restore changed the immutable student status history';
  end if;
end;
$student_archive$;

\echo '15. Verify attendance RPC permissions and private tables'
do $attendance_migration$
begin
 if has_table_privilege('anon','public.attendance_sessions','select')
   or has_table_privilege('authenticated','public.attendance_sessions','select')
   or has_table_privilege('authenticated','public.attendance_entries','insert') then
  raise exception 'Attendance tables unexpectedly expose direct access';
 end if;
 if to_regprocedure('public.my_teacher_attendance_roster(date)') is null
   or to_regprocedure('public.save_class_attendance(uuid,date,jsonb)') is null
   or to_regprocedure('public.submit_class_attendance(uuid)') is null
   or to_regprocedure('public.my_student_attendance()') is null then
  raise exception 'Required attendance RPC is missing';
 end if;
 if not exists (select 1 from public.role_permissions rp join public.roles r on r.id=rp.role_id
   join public.permissions p on p.id=rp.permission_id where r.slug='guru' and p.code='attendance:take') then
  raise exception 'Guru role is missing attendance:take';
 end if;
end;
$attendance_migration$;

\echo '16. Verify monthly attendance summary permissions and aggregation'
reset role;
select set_config('request.jwt.claim.sub', '50000000-0000-4000-8000-000000000001', false);
insert into public.students (id,nis,full_name,gender,enrollment_year)
values
 ('60000000-0000-4000-8000-000000000016','ATT-MONTH-016','Siswa Rekap Hadir','male',2026),
 ('60000000-0000-4000-8000-000000000017','ATT-MONTH-017','Siswa Rekap Alpa','female',2026);
insert into public.student_class_enrollments(student_id,academic_year_id,class_group_id,assigned_by)
values
 ('60000000-0000-4000-8000-000000000016','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001'),
 ('60000000-0000-4000-8000-000000000017','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001');
insert into public.attendance_sessions(id,academic_year_id,class_group_id,attendance_date,status,submitted_at)
values ('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','2026-11-12','submitted',now());
insert into public.attendance_entries(id,session_id,student_id,enrollment_id,status)
select
 case when st.id='60000000-0000-4000-8000-000000000016' then '80000000-0000-4000-8000-000000000001'::uuid else '80000000-0000-4000-8000-000000000002'::uuid end,
 '70000000-0000-4000-8000-000000000001',st.id,en.id,
 case when st.id='60000000-0000-4000-8000-000000000016' then 'present' else 'absent' end
from public.students st
join public.student_class_enrollments en on en.student_id=st.id
where st.id in ('60000000-0000-4000-8000-000000000016','60000000-0000-4000-8000-000000000017');

select set_config('test.permissions','attendance:view_all',false);
set role authenticated;
do $attendance_monthly$
declare result record;
begin
 select * into result from public.admin_attendance_monthly_summary('2026-11-01');
 if result.class_group_id <> '20000000-0000-4000-8000-000000000001'
   or result.session_count <> 1 or result.student_day_count <> 2
   or result.present_count <> 1 or result.absent_count <> 1
   or result.attendance_percentage <> 50.00 then
  raise exception 'Monthly attendance aggregation returned unexpected values: %', row_to_json(result);
 end if;
 begin
  perform * from public.admin_attendance_monthly_summary('2026-11-12');
  raise exception 'Monthly attendance RPC accepted a non-first day month parameter';
 exception when invalid_parameter_value then null;
 end;
end
$attendance_monthly$;
reset role;
select set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000002',false);
select set_config('test.permissions','',false);
set role authenticated;
do $attendance_monthly_access$
begin
 begin
  perform * from public.admin_attendance_monthly_summary('2026-11-01');
  raise exception 'User without attendance:view_all unexpectedly read monthly summary';
 exception when insufficient_privilege then null;
 end;
end
$attendance_monthly_access$;
reset role;
do $attendance_monthly_grants$
begin
 if has_function_privilege('anon','public.admin_attendance_monthly_summary(date)','execute') then
  raise exception 'anon unexpectedly can execute monthly attendance summary';
 end if;
 if not has_function_privilege('authenticated','public.admin_attendance_monthly_summary(date)','execute') then
  raise exception 'authenticated is missing monthly attendance summary RPC execute';
 end if;
end
$attendance_monthly_grants$;

\echo 'Database migration assertions passed.'

