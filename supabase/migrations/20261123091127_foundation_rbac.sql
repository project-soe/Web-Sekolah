-- Fondasi: ekstensi, RBAC, profil pengguna, RLS.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Tabel ------------------------------------------------------------

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+:[a-z_]+$'),
  module text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);
create index role_permissions_permission_idx on public.role_permissions (permission_id);

-- Profil pengguna: 1 baris per akun Supabase Auth. Akun baru NON-AKTIF dan tanpa role.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index users_email_lower_idx on public.users (lower(email));

create table public.user_roles (
  user_id uuid not null references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_role_idx on public.user_roles (role_id);

create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- Fungsi akses -----------------------------------------------------

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.roles r on r.id = ur.role_id
    where u.id = (select auth.uid())
      and u.is_active and u.deleted_at is null
      and r.slug = 'super_admin'
  );
$$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where u.id = (select auth.uid())
      and u.is_active and u.deleted_at is null
      and p.code = perm
  );
$$;

-- Hanya super admin yang boleh memberikan role super_admin.
create or replace function public.role_assignable(rid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.roles r
    where r.id = rid and (r.slug <> 'super_admin' or public.is_super_admin())
  );
$$;

revoke all on function public.is_super_admin(), public.has_permission(text),
  public.role_assignable(uuid) from public, anon;
grant execute on function public.is_super_admin(), public.has_permission(text),
  public.role_assignable(uuid) to authenticated, service_role;

-- Profil otomatis saat akun Auth dibuat (non-aktif, tanpa role).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pengguna biasa tidak boleh mengaktifkan/menghapus akunnya sendiri.
-- (Koneksi tanpa JWT, mis. SQL editor atau service role, diizinkan.)
create or replace function public.guard_user_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.is_active is distinct from old.is_active
      or new.deleted_at is distinct from old.deleted_at)
     and (select auth.uid()) is not null
     and not public.has_permission('users:update') then
    raise exception 'Tidak diizinkan mengubah status akun' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.guard_user_update() from public, anon, authenticated;

create trigger users_guard before update on public.users
  for each row execute function public.guard_user_update();

-- Hak akses tabel (lapisan sebelum RLS) -----------------------------

revoke all on table public.roles, public.permissions, public.role_permissions,
  public.users, public.user_roles from anon;
revoke truncate, references, trigger on table public.roles, public.permissions,
  public.role_permissions, public.users, public.user_roles from authenticated;
revoke insert, delete, update on table public.users from authenticated;
grant update (full_name, avatar_url, is_active, deleted_at) on table public.users to authenticated;

-- Tabel baru berikutnya juga tidak mewarisi TRUNCATE/REFERENCES/TRIGGER.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

-- RLS --------------------------------------------------------------

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;

create policy roles_select on public.roles for select to authenticated
  using (public.has_permission('roles:view') or public.has_permission('users:assign_roles'));
create policy roles_insert on public.roles for insert to authenticated
  with check (public.has_permission('roles:create') and slug <> 'super_admin');
create policy roles_update on public.roles for update to authenticated
  using (public.has_permission('roles:update') and slug <> 'super_admin')
  with check (public.has_permission('roles:update') and slug <> 'super_admin');
create policy roles_delete on public.roles for delete to authenticated
  using (public.has_permission('roles:delete') and not is_system);

-- Katalog permission hanya diubah lewat migrasi (tanpa policy tulis).
create policy permissions_select on public.permissions for select to authenticated
  using (public.has_permission('roles:view'));

create policy role_permissions_select on public.role_permissions for select to authenticated
  using (public.has_permission('roles:view'));
create policy role_permissions_insert on public.role_permissions for insert to authenticated
  with check (public.has_permission('roles:update') and public.role_assignable(role_id));
create policy role_permissions_delete on public.role_permissions for delete to authenticated
  using (public.has_permission('roles:update') and public.role_assignable(role_id));

create policy users_select on public.users for select to authenticated
  using (id = (select auth.uid()) or public.has_permission('users:view'));
create policy users_update on public.users for update to authenticated
  using (id = (select auth.uid()) or public.has_permission('users:update'))
  with check (id = (select auth.uid()) or public.has_permission('users:update'));

create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('users:view'));
create policy user_roles_insert on public.user_roles for insert to authenticated
  with check (public.has_permission('users:assign_roles') and public.role_assignable(role_id));
create policy user_roles_delete on public.user_roles for delete to authenticated
  using (public.has_permission('users:assign_roles') and public.role_assignable(role_id));

-- Data awal (konfigurasi sistem, bukan data dummy) ------------------

insert into public.roles (slug, name, description, is_system) values
  ('super_admin', 'Super Admin', 'Akses penuh sistem', true),
  ('admin_sekolah', 'Admin Sekolah', 'Identitas sekolah, guru, siswa, jurusan, kelas, fasilitas', true),
  ('editor', 'Editor', 'Berita, halaman, pengumuman, galeri, dan konten publik', true),
  ('operator_ppdb', 'Operator PPDB', 'Pendaftaran, dokumen, verifikasi, seleksi', true),
  ('guru', 'Guru', 'Akses terbatas', true)
on conflict (slug) do nothing;

insert into public.permissions (code, module, action)
select m || ':' || a, m, a
from unnest(array[
  'school','teachers','students','alumni','departments','classes','subjects','facilities',
  'news','announcements','pages','galleries','achievements','extracurriculars','events',
  'documents','social','messages','admissions','users','roles','logs','reports','settings',
  'backup','homepage'
]) as m
cross join unnest(array['view','create','update','delete']) as a
on conflict (code) do nothing;

insert into public.permissions (code, module, action)
select c, split_part(c, ':', 1), split_part(c, ':', 2)
from unnest(array[
  'news:publish','announcements:publish','pages:publish','galleries:publish',
  'students:import','students:export',
  'admissions:verify','admissions:decide','admissions:export','admissions:documents',
  'users:assign_roles','backup:run'
]) as c
on conflict (code) do nothing;

-- super_admin tidak perlu baris di role_permissions (lewat is_super_admin()).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  (r.slug = 'admin_sekolah' and (
     p.module in ('school','teachers','students','alumni','departments','classes',
                  'subjects','facilities','social','homepage','messages')
     or p.code = 'reports:view'))
  or (r.slug = 'editor' and p.module in
     ('news','announcements','pages','galleries','achievements','extracurriculars',
      'events','documents'))
  or (r.slug = 'operator_ppdb' and p.module = 'admissions')
  or (r.slug = 'guru' and p.code in ('classes:view','subjects:view'))
)
on conflict do nothing;
