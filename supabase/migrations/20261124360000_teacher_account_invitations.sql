-- Undangan akun guru: identitas login dipisahkan dari profil publik teachers.
create table public.teacher_user_links (
  teacher_id uuid primary key references public.teachers(id) on delete restrict,
  user_id uuid not null unique references public.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  linked_by uuid references public.users(id) on delete set null
);

create table public.teacher_account_invitations (
  token_hash bytea primary key check (octet_length(token_hash) = 32),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  invited_email text not null check (invited_email = lower(btrim(invited_email))),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  claimed_by uuid references public.users(id) on delete set null,
  claimed_at timestamptz,
  revoked_at timestamptz,
  check ((claimed_by is null) = (claimed_at is null)),
  check (claimed_at is null or revoked_at is null)
);

create unique index teacher_account_one_open_invitation_idx
  on public.teacher_account_invitations(teacher_id)
  where claimed_at is null and revoked_at is null;

alter table public.teacher_user_links enable row level security;
alter table public.teacher_account_invitations enable row level security;
revoke all on public.teacher_user_links, public.teacher_account_invitations from anon, authenticated;
revoke truncate, references, trigger on public.teacher_user_links, public.teacher_account_invitations from authenticated;

insert into public.roles(slug, name, description, is_system)
values ('guru', 'Guru', 'Akses terbatas', true)
on conflict (slug) do nothing;

insert into public.permissions(code, module, action)
values ('teacher_accounts:manage', 'teacher_accounts', 'manage'),
       ('teacher_portal:view', 'teacher_portal', 'view')
on conflict (code) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'teacher_portal:view'
where r.slug = 'guru'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'teacher_accounts:manage'
where r.slug = 'admin_sekolah'
on conflict do nothing;

create or replace function public.create_teacher_account_invitation(p_teacher_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_token text;
begin
  if not public.has_permission('teacher_accounts:manage') then
    raise exception 'Tidak diizinkan membuat undangan akun guru' using errcode = '42501';
  end if;

  select lower(btrim(email)) into v_email
  from public.teachers
  where id = p_teacher_id and email is not null
  for update;
  if not found then
    raise exception 'Profil guru tidak ditemukan atau belum memiliki email' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.teacher_user_links where teacher_id = p_teacher_id) then
    raise exception 'Profil guru sudah terhubung ke akun' using errcode = '23505';
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email sudah digunakan akun. Hubungi administrator untuk pemeriksaan manual.' using errcode = '23505';
  end if;

  update public.teacher_account_invitations
  set revoked_at = now()
  where teacher_id = p_teacher_id and claimed_at is null and revoked_at is null;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.teacher_account_invitations(
    token_hash, teacher_id, invited_email, created_by, expires_at
  ) values (
    extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'),
    p_teacher_id, v_email, (select auth.uid()), now() + interval '24 hours'
  );
  return v_token;
end;
$$;

create or replace function public.revoke_teacher_account_invitation(p_teacher_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.has_permission('teacher_accounts:manage') then
    raise exception 'Tidak diizinkan mencabut undangan akun guru' using errcode = '42501';
  end if;
  update public.teacher_account_invitations
  set revoked_at = now()
  where teacher_id = p_teacher_id and claimed_at is null and revoked_at is null;
end;
$$;

create or replace function public.validate_teacher_account_invitation(p_token text, p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $fn$
  select p_token is not null
    and length(p_token) = 64
    and translate(p_token, '0123456789abcdef', '') = ''
    and p_email is not null
    and exists (
      select 1 from public.teacher_account_invitations i
      where i.token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
        and i.claimed_at is null and i.revoked_at is null and i.expires_at > now()
        and i.invited_email = lower(btrim(p_email))
    );
$fn$;

create or replace function public.claim_teacher_account_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_invitation public.teacher_account_invitations%rowtype;
  v_auth_email text;
  v_confirmed_at timestamptz;
  v_role_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Autentikasi diperlukan' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Undangan tidak valid atau kedaluwarsa' using errcode = 'P0002';
  end if;

  select email, email_confirmed_at into v_auth_email, v_confirmed_at
  from auth.users where id = (select auth.uid());
  if v_auth_email is null or v_confirmed_at is null then
    raise exception 'Email harus diverifikasi terlebih dahulu' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.teacher_account_invitations
  where token_hash = extensions.digest(convert_to(p_token, 'UTF8'), 'sha256')
    and claimed_at is null and revoked_at is null and expires_at > now()
  for update;
  if not found then
    raise exception 'Undangan tidak valid, sudah digunakan, atau kedaluwarsa' using errcode = 'P0002';
  end if;
  if lower(v_auth_email) <> v_invitation.invited_email then
    raise exception 'Email akun tidak sesuai dengan email undangan' using errcode = '42501';
  end if;
  if exists (select 1 from public.teacher_user_links where teacher_id = v_invitation.teacher_id)
    or exists (select 1 from public.teacher_user_links where user_id = (select auth.uid())) then
    raise exception 'Profil guru atau akun sudah terhubung' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.users
    where id = (select auth.uid()) and (is_active or deleted_at is not null)
  ) or exists (select 1 from public.user_roles where user_id = (select auth.uid())) then
    raise exception 'Akun sudah aktif atau memiliki role lain' using errcode = '42501';
  end if;

  select id into v_role_id from public.roles where slug = 'guru';
  if v_role_id is null then raise exception 'Role guru belum tersedia' using errcode = 'P0002'; end if;

  insert into public.teacher_user_links(teacher_id, user_id, linked_by)
  values (v_invitation.teacher_id, (select auth.uid()), v_invitation.created_by);
  insert into public.user_roles(user_id, role_id, assigned_by)
  values ((select auth.uid()), v_role_id, v_invitation.created_by);
  update public.users set is_active = true where id = (select auth.uid());
  update public.teacher_account_invitations
  set claimed_by = (select auth.uid()), claimed_at = now()
  where token_hash = v_invitation.token_hash;

  return v_invitation.teacher_id;
end;
$$;

revoke all on function public.validate_teacher_account_invitation(text, text),
  public.create_teacher_account_invitation(uuid),
  public.revoke_teacher_account_invitation(uuid),
  public.claim_teacher_account_invitation(text) from public, anon;
grant execute on function public.validate_teacher_account_invitation(text, text) to anon, authenticated;
grant execute on function public.create_teacher_account_invitation(uuid),
  public.revoke_teacher_account_invitation(uuid),
  public.claim_teacher_account_invitation(text) to authenticated;

comment on table public.teacher_user_links is
  'Pemetaan privat satu-ke-satu antara profil guru dan akun login; bukan bagian dari profil publik.';
comment on table public.teacher_account_invitations is
  'Token undangan guru satu kali; hanya hash token yang disimpan, masa berlaku 24 jam.';
