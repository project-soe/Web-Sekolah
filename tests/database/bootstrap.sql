-- Minimal Supabase-compatible PostgreSQL fixture for isolated migration tests.
-- This database is ephemeral and contains no production data.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema extensions;
create extension pg_trgm with schema extensions;

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
  id uuid primary key
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
