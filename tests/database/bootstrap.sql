-- Minimal Supabase-compatible PostgreSQL fixture for isolated migration tests.
-- This database is ephemeral and contains no production data.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema extensions;
create extension pg_trgm with schema extensions;
create extension pgcrypto with schema extensions;

create table auth.users (
  id uuid primary key,
  email text
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.users (
  id uuid primary key,
  email text,
  full_name text,
  is_active boolean not null default false,
  deleted_at timestamptz
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  action text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.departments (
  id uuid primary key
);

create table public.teachers (
  id uuid primary key
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Deterministic permission fixture: tests can switch the JWT-like permission
-- list per session without creating production RBAC identities.
create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
as $$
  select coalesce(
    perm = any(string_to_array(coalesce(current_setting('test.permissions', true), ''), ',')),
    false
  );
$$;

grant usage on schema public to anon, authenticated;
grant execute on function public.has_permission(text) to authenticated;
