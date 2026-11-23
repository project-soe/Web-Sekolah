-- Galeri sekolah: album dan foto dengan publikasi yang dikendalikan RBAC.

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 5000),
  cover_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint galleries_published_at_required check (status <> 'published' or published_at is not null)
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  image_path text not null,
  alt_text text check (char_length(alt_text) <= 200),
  caption text check (char_length(caption) <= 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (gallery_id, image_path)
);

create index galleries_publication_idx
  on public.galleries(sort_order, published_at desc)
  where status = 'published';
create index gallery_images_order_idx
  on public.gallery_images(gallery_id, sort_order, created_at);

create trigger galleries_updated_at before update on public.galleries
  for each row execute function public.set_updated_at();

revoke all on table public.galleries, public.gallery_images from anon, authenticated;
grant select on table public.galleries, public.gallery_images to anon, authenticated;
grant insert, update, delete on table public.galleries, public.gallery_images to authenticated;

alter table public.galleries enable row level security;
alter table public.gallery_images enable row level security;

-- Kebijakan anon tidak memanggil fungsi permission yang hanya tersedia bagi authenticated.
create policy galleries_public_select on public.galleries for select to anon
  using (status = 'published' and published_at <= now());
create policy galleries_staff_select on public.galleries for select to authenticated
  using (
    (status = 'published' and published_at <= now())
    or public.has_permission('galleries:view')
  );

create policy galleries_insert on public.galleries for insert to authenticated
  with check (public.has_permission('galleries:create'));
create policy galleries_update on public.galleries for update to authenticated
  using (public.has_permission('galleries:update'))
  with check (
    public.has_permission('galleries:update')
    and (status <> 'published' or public.has_permission('galleries:publish'))
  );
create policy galleries_delete on public.galleries for delete to authenticated
  using (public.has_permission('galleries:delete'));

create policy gallery_images_public_select on public.gallery_images for select to anon
  using (exists (
    select 1 from public.galleries g
    where g.id = gallery_images.gallery_id
      and g.status = 'published' and g.published_at <= now()
  ));
create policy gallery_images_staff_select on public.gallery_images for select to authenticated
  using (
    public.has_permission('galleries:view')
    or exists (
      select 1 from public.galleries g
      where g.id = gallery_images.gallery_id
        and g.status = 'published' and g.published_at <= now()
    )
  );

create policy gallery_images_insert on public.gallery_images for insert to authenticated
  with check (
    public.has_permission('galleries:create')
    and exists (
      select 1 from public.galleries g
      where g.id = gallery_images.gallery_id
        and public.has_permission('galleries:update')
    )
  );
create policy gallery_images_update on public.gallery_images for update to authenticated
  using (
    public.has_permission('galleries:update')
    and exists (select 1 from public.galleries g where g.id = gallery_images.gallery_id)
  )
  with check (
    public.has_permission('galleries:update')
    and exists (select 1 from public.galleries g where g.id = gallery_images.gallery_id)
  );
create policy gallery_images_delete on public.gallery_images for delete to authenticated
  using (public.has_permission('galleries:delete') or public.has_permission('galleries:update'));
