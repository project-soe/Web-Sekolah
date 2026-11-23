-- Prestasi sekolah dengan kontrol publikasi berbasis RBAC.

insert into public.permissions (code, module, action)
values ('achievements:publish', 'achievements', 'publish')
on conflict (code) do nothing;

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null check (char_length(description) between 1 and 10000),
  recipient text check (char_length(recipient) <= 180),
  achievement_level text not null default 'Sekolah'
    check (achievement_level in ('Sekolah','Kabupaten/Kota','Provinsi','Nasional','Internasional')),
  achievement_date date,
  image_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_published_at_required
    check (status <> 'published' or published_at is not null)
);

create index achievements_publication_idx
  on public.achievements(sort_order, achievement_date desc, published_at desc)
  where status = 'published';

create trigger achievements_updated_at before update on public.achievements
  for each row execute function public.set_updated_at();

revoke all on table public.achievements from anon, authenticated;
grant select on table public.achievements to anon, authenticated;
grant insert, update, delete on table public.achievements to authenticated;

alter table public.achievements enable row level security;

create policy achievements_public_select on public.achievements for select to anon
  using (status = 'published' and published_at <= now());

create policy achievements_staff_select on public.achievements for select to authenticated
  using (
    (status = 'published' and published_at <= now())
    or public.has_permission('achievements:view')
  );

create policy achievements_insert on public.achievements for insert to authenticated
  with check (
    public.has_permission('achievements:create')
    and (status <> 'published' or public.has_permission('achievements:publish'))
  );

create policy achievements_update on public.achievements for update to authenticated
  using (public.has_permission('achievements:update'))
  with check (
    public.has_permission('achievements:update')
    and (status <> 'published' or public.has_permission('achievements:publish'))
  );

create policy achievements_delete on public.achievements for delete to authenticated
  using (public.has_permission('achievements:delete'));
