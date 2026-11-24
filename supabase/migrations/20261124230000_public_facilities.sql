-- CMS fasilitas sekolah: gedung, ruang, laboratorium, dan fasilitas pendukung.
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  facility_type text not null default 'lainnya'
    check (facility_type in ('gedung','ruang','laboratorium','olahraga','ibadah','lainnya')),
  description text check (char_length(description) <= 5000),
  location text check (char_length(location) <= 200),
  capacity integer check (capacity is null or capacity between 1 and 100000),
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index facilities_public_idx on public.facilities(facility_type, sort_order, name)
  where is_published;

create trigger facilities_updated_at before update on public.facilities
  for each row execute function public.set_updated_at();

insert into public.permissions (code, module, action)
values
  ('facilities:view','facilities','view'),
  ('facilities:create','facilities','create'),
  ('facilities:update','facilities','update'),
  ('facilities:delete','facilities','delete'),
  ('facilities:publish','facilities','publish')
on conflict (code) do nothing;

revoke all on table public.facilities from anon, authenticated;
grant select on table public.facilities to anon, authenticated;
grant insert, update, delete on table public.facilities to authenticated;
alter table public.facilities enable row level security;

create policy facilities_select on public.facilities for select to anon, authenticated
  using (is_published or public.has_permission('facilities:view'));
create policy facilities_insert on public.facilities for insert to authenticated
  with check (public.has_permission('facilities:create')
    and (not is_published or public.has_permission('facilities:publish')));
create policy facilities_update on public.facilities for update to authenticated
  using (public.has_permission('facilities:update')
    and (not is_published or public.has_permission('facilities:publish')))
  with check (public.has_permission('facilities:update')
    and (not is_published or public.has_permission('facilities:publish')));
create policy facilities_delete on public.facilities for delete to authenticated
  using (public.has_permission('facilities:delete'));

-- Izinkan penghapusan objek media oleh pengelola fasilitas yang berwenang.
create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','teachers:delete',
    'departments:create','departments:update','departments:delete',
    'facilities:create','facilities:update','facilities:delete',
    'news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','galleries:delete',
    'achievements:create','achievements:update','achievements:delete',
    'extracurriculars:create','extracurriculars:update','events:create','events:update',
    'events:delete','announcements:create','announcements:update',
    'homepage:update','social:update','users:update'
  ]);
$$;
revoke all on function public.can_manage_media() from public, anon;
grant execute on function public.can_manage_media() to authenticated;
