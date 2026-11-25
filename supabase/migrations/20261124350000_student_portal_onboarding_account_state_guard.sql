-- Defense in depth for student portal activation. Keep migration 3400 immutable.
create or replace function public.claim_student_portal_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_invitation public.student_portal_invitations%rowtype;
  v_student_status text;
  v_role_id uuid;
  v_user_email text;
  v_user_active boolean;
  v_user_deleted_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Autentikasi diperlukan' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002';
  end if;

  select is_active, deleted_at into v_user_active, v_user_deleted_at
  from public.users where id = (select auth.uid()) for update;
  if not found or v_user_active is distinct from false or v_user_deleted_at is not null then
    raise exception 'Hanya akun baru yang belum aktif yang dapat mengklaim undangan' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.student_portal_invitations
  where token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and claimed_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002'; end if;

  select status into v_student_status from public.students
  where id = v_invitation.student_id for update;
  if v_student_status is distinct from 'active' then
    raise exception 'Siswa tidak lagi aktif' using errcode = '23514';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = v_invitation.student_id) then
    raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505';
  end if;
  if exists (select 1 from public.student_portal_accounts where user_id = (select auth.uid())) then
    raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505';
  end if;

  select email into v_user_email from auth.users where id = (select auth.uid());
  if v_user_email is null then raise exception 'Akun autentikasi tidak ditemukan' using errcode = 'P0002'; end if;

  insert into public.student_portal_accounts(user_id, student_id, linked_by)
  values ((select auth.uid()), v_invitation.student_id, v_invitation.created_by);
  update public.student_portal_invitations
  set claimed_by = (select auth.uid()), claimed_at = now()
  where token_hash = v_invitation.token_hash;
  update public.users set is_active = true where id = (select auth.uid());

  select id into v_role_id from public.roles where slug = 'siswa';
  if v_role_id is null then raise exception 'Role siswa belum tersedia' using errcode = 'P0002'; end if;
  insert into public.user_roles(user_id, role_id, assigned_by)
  values ((select auth.uid()), v_role_id, v_invitation.created_by)
  on conflict do nothing;
  return v_invitation.student_id;
end;
$$;

create or replace function public.approve_student_portal_registration(p_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_request public.student_portal_registration_requests%rowtype;
  v_student_id uuid;
  v_role_id uuid;
  v_user_active boolean;
  v_user_deleted_at timestamptz;
begin
  if not public.has_permission('students:view') or not public.has_permission('students:update') then
    raise exception 'Tidak diizinkan memverifikasi pendaftaran portal' using errcode = '42501';
  end if;

  select * into v_request from public.student_portal_registration_requests
  where id = p_request_id for update;
  if not found then raise exception 'Pendaftaran tidak ditemukan' using errcode = 'P0002'; end if;
  if v_request.status <> 'pending' then
    raise exception 'Pendaftaran sudah diproses' using errcode = '23514';
  end if;

  select is_active, deleted_at into v_user_active, v_user_deleted_at
  from public.users where id = v_request.user_id for update;
  if not found or v_user_active is distinct from false or v_user_deleted_at is not null then
    raise exception 'Akun pendaftar harus tetap baru dan belum aktif saat disetujui' using errcode = '42501';
  end if;

  select id into v_student_id from public.students
  where nis = v_request.requested_nis
    and birth_date = v_request.requested_birth_date
    and lower(btrim(full_name)) = lower(btrim(v_request.requested_full_name))
    and status = 'active'
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
  if v_role_id is null then raise exception 'Role siswa belum tersedia' using errcode = 'P0002'; end if;
  insert into public.user_roles(user_id, role_id, assigned_by)
  values (v_request.user_id, v_role_id, (select auth.uid()))
  on conflict do nothing;
  update public.student_portal_registration_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = p_request_id;
  return v_student_id;
end;
$$;

revoke all on function public.claim_student_portal_invitation(text),
  public.approve_student_portal_registration(uuid) from public, anon;
grant execute on function public.claim_student_portal_invitation(text),
  public.approve_student_portal_registration(uuid) to authenticated;
