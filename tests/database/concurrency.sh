#!/usr/bin/env bash
set -euo pipefail

actor_id="50000000-0000-4000-8000-000000000001"
year_one="10000000-0000-4000-8000-000000000001"
year_two="10000000-0000-4000-8000-000000000002"
lock_key_a=2026112428
lock_key_b=1

# Session one deliberately holds the same transaction advisory lock before
# calling the RPC. Session two starts while that lock is held and must wait.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  begin;
  set role authenticated;
  select set_config('request.jwt.claim.sub', '$actor_id', false);
  select set_config('test.permissions', 'classes:update', false);
  select pg_advisory_xact_lock($lock_key_a, $lock_key_b);
  select pg_sleep(1);
  select public.activate_academic_year('$year_one');
  commit;
" >/tmp/academic-year-activation-one.log 2>&1 &
first_pid=$!

sleep 0.2

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
  begin;
  set role authenticated;
  select set_config('request.jwt.claim.sub', '$actor_id', false);
  select set_config('test.permissions', 'classes:update', false);
  select public.activate_academic_year('$year_two');
  commit;
" >/tmp/academic-year-activation-two.log 2>&1 &
second_pid=$!

wait "$first_pid"
wait "$second_pid"

active_count="$(psql "$DATABASE_URL" -Atqc "select count(*) from public.academic_years where is_active")"
active_id="$(psql "$DATABASE_URL" -Atqc "select id from public.academic_years where is_active")"

if [[ "$active_count" != "1" || "$active_id" != "$year_two" ]]; then
  cat /tmp/academic-year-activation-one.log
  cat /tmp/academic-year-activation-two.log
  echo "Concurrent activation invariant failed: count=$active_count id=$active_id" >&2
  exit 1
fi

echo "Concurrent academic-year activation test passed."
