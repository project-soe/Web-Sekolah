#!/usr/bin/env bash
set -euo pipefail
actor_id="50000000-0000-4000-8000-000000000001"
year_id="10000000-0000-4000-8000-000000000002"
class_id="20000000-0000-4000-8000-000000000003"
student_one="60000000-0000-4000-8000-000000000004"
student_two="60000000-0000-4000-8000-000000000005"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  begin;
  set role authenticated;
  select set_config('request.jwt.claim.sub', '$actor_id', true);
  select set_config('test.permissions', 'students:view,students:update,classes:view,classes:update', true);
  select pg_sleep(0.5);
  insert into public.student_class_enrollments(student_id, academic_year_id, class_group_id)
  values ('$student_one', '$year_id', '$class_id');
  commit;
" >/tmp/class-capacity-one.log 2>&1 &
first_pid=$!

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  begin;
  set role authenticated;
  select set_config('request.jwt.claim.sub', '$actor_id', true);
  select set_config('test.permissions', 'students:view,students:update,classes:view,classes:update', true);
  insert into public.student_class_enrollments(student_id, academic_year_id, class_group_id)
  values ('$student_two', '$year_id', '$class_id');
  commit;
" >/tmp/class-capacity-two.log 2>&1 &
second_pid=$!

set +e
wait "$first_pid"; first_status=$?
wait "$second_pid"; second_status=$?
set -e

if [[ "$first_status" -eq 0 && "$second_status" -eq 0 ]] || [[ "$first_status" -ne 0 && "$second_status" -ne 0 ]]; then
  cat /tmp/class-capacity-one.log /tmp/class-capacity-two.log
  echo "Expected exactly one concurrent enrollment to succeed." >&2
  exit 1
fi

enrollment_count="$(psql "$DATABASE_URL" -Atqc "select count(*) from public.student_class_enrollments where class_group_id = '$class_id'")"
stored_count="$(psql "$DATABASE_URL" -Atqc "select enrolled_count from public.class_groups where id = '$class_id'")"
if [[ "$enrollment_count" != "1" || "$stored_count" != "1" ]]; then
  cat /tmp/class-capacity-one.log /tmp/class-capacity-two.log
  echo "Class capacity invariant failed: rows=$enrollment_count counter=$stored_count" >&2
  exit 1
fi
echo "Concurrent class-capacity enforcement test passed."
