-- The student master-data migration intentionally uses column-level grants
-- to protect lifecycle/audit fields. The email column was added later, so it
-- needs explicit insert/update privileges for authorized student editors.
grant insert (email) on public.students to authenticated;
grant update (email) on public.students to authenticated;

-- Normalize user-entered identity fields before matching a self-registration
-- request to the student master record. This tolerates casing and accidental
-- whitespace differences without weakening the date-of-birth check.
create or replace function public.approve_student_portal_registration(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.student_portal_registration_requests%rowtype;
  v_student_id uuid;
  v_role_id uuid;
begin
  if not public.has_permission('students:view')
    or not public.has_permission('students:update') then
    raise exception 'Tidak diizinkan memverifikasi pendaftaran portal' using errcode = '42501';
  end if;

  select * into v_request
  from public.student_portal_registration_requests
  where id = p_request_id
  for update;
  if not found then
    raise exception 'Pendaftaran tidak ditemukan' using errcode = 'P0002';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Pendaftaran sudah diproses' using errcode = '23514';
  end if;

  select s.id into v_student_id
  from public.students s
  where regexp_replace(btrim(s.nis), '[[:space:]]+', '', 'g')
      = regexp_replace(btrim(v_request.requested_nis), '[[:space:]]+', '', 'g')
    and s.birth_date = v_request.requested_birth_date
    and regexp_replace(lower(btrim(s.full_name)), '[[:space:]]+', ' ', 'g')
      = regexp_replace(lower(btrim(v_request.requested_full_name)), '[[:space:]]+', ' ', 'g')
    and s.status = 'active'
  for update;
  if not found then
    raise exception 'Data tidak cocok dengan siswa aktif. Periksa NIS, nama, dan tanggal lahir.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = v_student_id) then
    raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505';
  end if;
  if exists (select 1 from public.student_portal_accounts where user_id = v_request.user_id) then
    raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505';
  end if;

  insert into public.student_portal_accounts(user_id, student_id, linked_by)
  values (v_request.user_id, v_student_id, (select auth.uid()));
  update public.users set is_active = true where id = v_request.user_id;

  select id into v_role_id from public.roles where slug = 'siswa';
  if v_role_id is null then
    raise exception 'Role siswa belum tersedia' using errcode = 'P0002';
  end if;
  insert into public.user_roles(user_id, role_id, assigned_by)
  values (v_request.user_id, v_role_id, (select auth.uid()))
  on conflict do nothing;

  update public.student_portal_registration_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = p_request_id;

  return v_student_id;
end;
$$;
