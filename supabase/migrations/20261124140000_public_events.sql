-- Agenda sekolah dengan publikasi terjadwal dan kontrol RBAC.
insert into public.permissions (code, module, action)
values ('events:publish', 'events', 'publish')
on conflict (code) do nothing;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text check (char_length(summary) <= 500),
  description text not null check (char_length(description) between 1 and 20000),
  location text check (char_length(location) <= 240),
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_path text,
  registration_url text check (registration_url is null or registration_url ~ '^https://'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at),
  constraint events_published_at_required check (status <> 'published' or published_at is not null)
);

create index events_publication_idx
  on public.events(starts_at, sort_order, published_at desc)
  where status = 'published';

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update, delete on table public.events to authenticated;

alter table public.events enable row level security;

create policy events_public_select on public.events for select to anon
  using (status = 'published' and published_at <= now());

create policy events_staff_select on public.events for select to authenticated
  using (
    (status = 'published' and published_at <= now())
    or public.has_permission('events:view')
  );

create policy events_insert on public.events for insert to authenticated
  with check (
    public.has_permission('events:create')
    and (status <> 'published' or public.has_permission('events:publish'))
  );

create policy events_update on public.events for update to authenticated
  using (public.has_permission('events:update'))
  with check (
    public.has_permission('events:update')
    and (status <> 'published' or public.has_permission('events:publish'))
  );

create policy events_delete on public.events for delete to authenticated
  using (public.has_permission('events:delete'));
