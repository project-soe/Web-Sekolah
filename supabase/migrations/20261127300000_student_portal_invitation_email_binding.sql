-- Bind student portal invitations to the email stored on the student record.
alter table public.students
  add column if not exists email text
  check (email is null or (length(btrim(email)) <= 254 and position('@' in email) > 1));

alter table public.student_portal_invitations
  add column if not exists target_email text;

create or replace function public.create_student_portal_invitation(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_status text;
  v_email text;
begin
  if not public.has_permission('students:view')
    or not public.has_permission('students:update') then
    raise exception 'Tidak diizinkan membuat undangan portal' using errcode = '42501';
  end if;

  select status, email into v_status, v_email
  from public.students where id = p_student_id for update;
  if not found then raise exception 'Siswa tidak ditemukan' using errcode = 'P0002'; end if;
  if v_status <> 'active' then
    raise exception 'Hanya siswa aktif yang dapat memiliki akun portal' using errcode = '23514';
  end if;
  if v_email is null or length(btrim(v_email)) = 0 or position('@' in v_email) <= 1 then
    raise exception 'Email siswa wajib diisi sebelum membuat undangan' using errcode = '22023';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = p_student_id) then
    raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505';
  end if;

  delete from public.student_portal_invitations
  where student_id = p_student_id and claimed_at is null;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.student_portal_invitations(token_hash, student_id, target_email, created_by, expires_at)
  values (
    extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
    p_student_id, lower(btrim(v_email)), (select auth.uid()), now() + interval '7 days'
  );
  return v_token;
end;
$$;

create or replace function public.claim_student_portal_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.student_portal_invitations%rowtype;
  v_student_status text;
  v_role_id uuid;
  v_user_email text;
begin
  if (select auth.uid()) is null then
    raise exception 'Autentikasi diperlukan' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002';
  end if;

  select * into v_invitation
  from public.student_portal_invitations
  where token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and claimed_at is null and expires_at > now()
  for update;
  if not found then raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002'; end if;

  select email into v_user_email from auth.users where id = (select auth.uid());
  if v_user_email is null or v_invitation.target_email is null
    or lower(btrim(v_user_email)) <> lower(btrim(v_invitation.target_email)) then
    raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002';
  end if;

  select status into v_student_status
  from public.students where id = v_invitation.student_id for update;
  if v_student_status is distinct from 'active' then
    raise exception 'Siswa tidak lagi aktif' using errcode = '23514';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = v_invitation.student_id)
    then raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505'; end if;
  if exists (select 1 from public.student_portal_accounts where user_id = (select auth.uid()))
    then raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505'; end if;

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

revoke all on function public.create_student_portal_invitation(uuid),
  public.claim_student_portal_invitation(text) from public, anon;
grant execute on function public.create_student_portal_invitation(uuid),
  public.claim_student_portal_invitation(text) to authenticated;

comment on column public.students.email is
  'Alamat email yang ditetapkan sekolah untuk akun Portal Siswa; undangan dikunci ke alamat ini.';
comment on column public.student_portal_invitations.target_email is
  'Alamat email yang boleh mengklaim token undangan ini.';
