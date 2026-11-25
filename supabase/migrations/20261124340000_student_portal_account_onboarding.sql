-- Student portal identity, invitations, self-registration approval, and scoped access.
-- Auth users remain inactive until an administrator-issued invitation is claimed
-- or a self-registration request is explicitly approved.

create table public.student_portal_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  student_id uuid not null unique references public.students(id) on delete restrict,
  linked_at timestamptz not null default now(),
  linked_by uuid references public.users(id) on delete set null
);

create table public.student_portal_registration_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  email text not null,
  requested_full_name text not null check (length(btrim(requested_full_name)) between 2 and 150),
  requested_nis text not null check (length(btrim(requested_nis)) between 1 and 30),
  requested_birth_date date not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create index student_portal_requests_status_created_idx
  on public.student_portal_registration_requests(status, created_at desc);

create table public.student_portal_invitations (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  student_id uuid not null references public.students(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_by uuid references public.users(id) on delete set null,
  claimed_at timestamptz,
  check ((claimed_by is null) = (claimed_at is null))
);

create unique index student_portal_one_unclaimed_invite_idx
  on public.student_portal_invitations(student_id) where claimed_at is null;

alter table public.student_portal_accounts enable row level security;
alter table public.student_portal_registration_requests enable row level security;
alter table public.student_portal_invitations enable row level security;

revoke all on public.student_portal_accounts,
  public.student_portal_registration_requests,
  public.student_portal_invitations from anon, authenticated;
grant select on public.student_portal_accounts,
  public.student_portal_registration_requests,
  public.student_portal_invitations to authenticated;

create policy student_portal_accounts_select on public.student_portal_accounts
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('students:view'));

create policy student_portal_requests_select on public.student_portal_registration_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('students:view'));

create policy student_portal_invitations_select on public.student_portal_invitations
  for select to authenticated
  using (public.has_permission('students:view'));

-- Portal role has no administrative permissions and cannot query the students table.
insert into public.roles (slug, name, description, is_system)
values ('siswa', 'Siswa', 'Akses terbatas ke Portal Siswa', true)
on conflict (slug) do nothing;

insert into public.permissions (code, module, action)
values ('student_portal:view', 'student_portal', 'view')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'siswa' and p.code = 'student_portal:view'
on conflict do nothing;

-- The existing user guard permits activation only after a trusted account link exists.
-- A student may activate only their own newly linked account; an administrator with
-- students:update may activate a linked account during manual approval.
create or replace function public.guard_user_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.is_active is distinct from old.is_active
      or new.deleted_at is distinct from old.deleted_at)
     and (select auth.uid()) is not null
     and not public.has_permission('users:update') then
    if new.deleted_at is distinct from old.deleted_at then
      raise exception 'Tidak diizinkan mengubah status akun' using errcode = '42501';
    end if;
    if not (
      new.is_active is true
      and old.is_active is false
      and exists (
        select 1 from public.student_portal_accounts spa where spa.user_id = old.id
      )
      and (
        (select auth.uid()) = old.id
        or public.has_permission('students:update')
      )
    ) then
      raise exception 'Tidak diizinkan mengubah status akun' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create or replace function public.create_student_portal_invitation(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_status text;
begin
  if not public.has_permission('students:view')
    or not public.has_permission('students:update') then
    raise exception 'Tidak diizinkan membuat undangan portal' using errcode = '42501';
  end if;

  select status into v_status from public.students where id = p_student_id for update;
  if not found then raise exception 'Siswa tidak ditemukan' using errcode = 'P0002'; end if;
  if v_status <> 'active' then
    raise exception 'Hanya siswa aktif yang dapat memiliki akun portal' using errcode = '23514';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = p_student_id) then
    raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505';
  end if;

  delete from public.student_portal_invitations
  where student_id = p_student_id and claimed_at is null;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.student_portal_invitations(token_hash, student_id, created_by, expires_at)
  values (
    extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
    p_student_id, (select auth.uid()), now() + interval '7 days'
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

  select status into v_student_status
  from public.students where id = v_invitation.student_id for update;
  if v_student_status is distinct from 'active' then
    raise exception 'Siswa tidak lagi aktif' using errcode = '23514';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = v_invitation.student_id)
    then raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505'; end if;
  if exists (select 1 from public.student_portal_accounts where user_id = (select auth.uid()))
    then raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505'; end if;

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

create or replace function public.submit_student_portal_registration(
  p_full_name text, p_nis text, p_birth_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_request_id uuid;
begin
  if v_user_id is null then raise exception 'Autentikasi diperlukan' using errcode = '42501'; end if;
  if p_full_name is null or length(btrim(p_full_name)) not between 2 and 150
    or p_nis is null or length(btrim(p_nis)) not between 1 and 30
    or p_birth_date is null then
    raise exception 'Data pendaftaran tidak valid' using errcode = '22023';
  end if;
  if exists (select 1 from public.student_portal_accounts where user_id = v_user_id)
    then raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505'; end if;
  if exists (select 1 from public.users where id = v_user_id and (is_active or deleted_at is not null))
    then raise exception 'Akun tidak memenuhi syarat pendaftaran portal' using errcode = '42501'; end if;

  select email into v_email from public.users where id = v_user_id;
  if v_email is null then raise exception 'Profil akun tidak ditemukan' using errcode = 'P0002'; end if;

  insert into public.student_portal_registration_requests(
    user_id, email, requested_full_name, requested_nis, requested_birth_date
  ) values (v_user_id, v_email, btrim(p_full_name), btrim(p_nis), p_birth_date)
  returning id into v_request_id;
  return v_request_id;
end;
$$;

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

  select * into v_request from public.student_portal_registration_requests
  where id = p_request_id for update;
  if not found then raise exception 'Pendaftaran tidak ditemukan' using errcode = 'P0002'; end if;
  if v_request.status <> 'pending' then
    raise exception 'Pendaftaran sudah diproses' using errcode = '23514';
  end if;

  select id into v_student_id
  from public.students
  where nis = v_request.requested_nis
    and birth_date = v_request.requested_birth_date
    and lower(btrim(full_name)) = lower(btrim(v_request.requested_full_name))
    and status = 'active'
  for update;
  if not found then
    raise exception 'Data tidak cocok dengan siswa aktif. Periksa NIS, nama, dan tanggal lahir.' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.student_portal_accounts where student_id = v_student_id)
    then raise exception 'Siswa sudah memiliki akun portal' using errcode = '23505'; end if;
  if exists (select 1 from public.student_portal_accounts where user_id = v_request.user_id)
    then raise exception 'Akun sudah terhubung ke data siswa' using errcode = '23505'; end if;

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

create or replace function public.reject_student_portal_registration(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('students:view')
    or not public.has_permission('students:update') then
    raise exception 'Tidak diizinkan memverifikasi pendaftaran portal' using errcode = '42501';
  end if;
  update public.student_portal_registration_requests
  set status = 'rejected', reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = p_request_id and status = 'pending';
  if not found then raise exception 'Pendaftaran tidak ditemukan atau sudah diproses' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.my_student_portal_profile()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'student_id', s.id,
    'full_name', s.full_name,
    'nis', s.nis,
    'nisn', s.nisn,
    'status', s.status,
    'enrollment_year', s.enrollment_year,
    'department', d.name,
    'class_name', cg.name,
    'academic_year', ay.name
  )
  from public.student_portal_accounts spa
  join public.students s on s.id = spa.student_id
  left join public.departments d on d.id = s.department_id
  left join public.student_class_enrollments e
    on e.student_id = s.id and e.ended_at is null
  left join public.academic_years ay on ay.id = e.academic_year_id and ay.is_active
  left join public.class_groups cg on cg.id = e.class_group_id
  where spa.user_id = (select auth.uid())
    and public.has_permission('student_portal:view')
  order by ay.is_active desc nulls last
  limit 1;
$$;

revoke all on function public.create_student_portal_invitation(uuid),
  public.claim_student_portal_invitation(text),
  public.submit_student_portal_registration(text,text,date),
  public.approve_student_portal_registration(uuid),
  public.reject_student_portal_registration(uuid),
  public.my_student_portal_profile() from public, anon;
grant execute on function public.create_student_portal_invitation(uuid),
  public.claim_student_portal_invitation(text),
  public.submit_student_portal_registration(text,text,date),
  public.approve_student_portal_registration(uuid),
  public.reject_student_portal_registration(uuid),
  public.my_student_portal_profile() to authenticated;

comment on table public.student_portal_accounts is
  'Relasi privat satu akun Portal Siswa ke satu data induk siswa; hanya dibuat melalui RPC tepercaya.';
comment on table public.student_portal_registration_requests is
  'Antrean pendaftaran mandiri Portal Siswa; identitas baru ditautkan setelah verifikasi admin.';
comment on table public.student_portal_invitations is
  'Hash undangan sekali pakai untuk aktivasi akun Portal Siswa; token mentah hanya dikembalikan saat dibuat.';
