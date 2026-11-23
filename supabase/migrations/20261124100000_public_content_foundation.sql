-- Fondasi konten publik: data akademik dan publikasi sekolah.
-- Konten hanya tampil untuk publik setelah dipublikasikan dan tanggal tayangnya tiba.

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 5000),
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 150),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  employee_number text check (char_length(employee_number) <= 40),
  position text check (char_length(position) <= 120),
  department_id uuid references public.departments(id) on delete set null,
  education text check (char_length(education) <= 200),
  biography text check (char_length(biography) <= 5000),
  photo_path text,
  email text check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index teachers_department_idx on public.teachers(department_id, sort_order);
create index teachers_public_idx on public.teachers(sort_order, full_name) where is_published;

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.news_categories(id) on delete set null,
  author_id uuid references public.users(id) on delete set null,
  title text not null check (char_length(title) between 5 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text check (char_length(excerpt) <= 500),
  content text not null check (char_length(content) between 1 and 50000),
  cover_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_published_at_required check (status <> 'published' or published_at is not null)
);
create index news_publication_idx on public.news(published_at desc) where status = 'published';
create index news_category_idx on public.news(category_id, published_at desc);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users(id) on delete set null,
  title text not null check (char_length(title) between 5 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text check (char_length(summary) <= 500),
  content text not null check (char_length(content) between 1 and 30000),
  attachment_path text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_published_at_required check (status <> 'published' or published_at is not null),
  constraint announcements_expiry_after_publish check (expires_at is null or published_at is null or expires_at > published_at)
);
create index announcements_publication_idx on public.announcements(published_at desc) where status = 'published';

create trigger departments_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger teachers_updated_at before update on public.teachers
  for each row execute function public.set_updated_at();
create trigger news_categories_updated_at before update on public.news_categories
  for each row execute function public.set_updated_at();
create trigger news_updated_at before update on public.news
  for each row execute function public.set_updated_at();
create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

-- Hak tabel: data dapat dibaca publik, perubahan hanya melalui permission RBAC.
revoke all on table public.departments, public.teachers, public.news_categories,
  public.news, public.announcements from anon, authenticated;
grant select on table public.departments, public.teachers, public.news_categories,
  public.news, public.announcements to anon, authenticated;
grant insert, update, delete on table public.departments, public.teachers,
  public.news_categories, public.news, public.announcements to authenticated;

alter table public.departments enable row level security;
alter table public.teachers enable row level security;
alter table public.news_categories enable row level security;
alter table public.news enable row level security;
alter table public.announcements enable row level security;

-- Akademik: publik hanya melihat data yang ditandai tampil.
create policy departments_select on public.departments for select to anon, authenticated
  using (is_published or public.has_permission('departments:view'));
create policy departments_insert on public.departments for insert to authenticated
  with check (public.has_permission('departments:create'));
create policy departments_update on public.departments for update to authenticated
  using (public.has_permission('departments:update'))
  with check (public.has_permission('departments:update'));
create policy departments_delete on public.departments for delete to authenticated
  using (public.has_permission('departments:delete'));

create policy teachers_select on public.teachers for select to anon, authenticated
  using (is_published or public.has_permission('teachers:view'));
create policy teachers_insert on public.teachers for insert to authenticated
  with check (public.has_permission('teachers:create'));
create policy teachers_update on public.teachers for update to authenticated
  using (public.has_permission('teachers:update'))
  with check (public.has_permission('teachers:update'));
create policy teachers_delete on public.teachers for delete to authenticated
  using (public.has_permission('teachers:delete'));

-- Konten: draft hanya dapat dibaca pengguna yang memiliki permission view.
create policy news_categories_select on public.news_categories for select to anon, authenticated
  using (public.has_permission('news:view') or exists (
    select 1 from public.news n
    where n.category_id = news_categories.id and n.status = 'published'
      and n.published_at <= now()
  ));
create policy news_categories_insert on public.news_categories for insert to authenticated
  with check (public.has_permission('news:create'));
create policy news_categories_update on public.news_categories for update to authenticated
  using (public.has_permission('news:update'))
  with check (public.has_permission('news:update'));
create policy news_categories_delete on public.news_categories for delete to authenticated
  using (public.has_permission('news:delete'));

create policy news_select on public.news for select to anon, authenticated
  using (
    (status = 'published' and published_at <= now())
    or public.has_permission('news:view')
  );
create policy news_insert on public.news for insert to authenticated
  with check (public.has_permission('news:create'));
create policy news_update on public.news for update to authenticated
  using (public.has_permission('news:update'))
  with check (public.has_permission('news:update'));
create policy news_delete on public.news for delete to authenticated
  using (public.has_permission('news:delete'));

create policy announcements_select on public.announcements for select to anon, authenticated
  using (
    (status = 'published' and published_at <= now()
      and (expires_at is null or expires_at > now()))
    or public.has_permission('announcements:view')
  );
create policy announcements_insert on public.announcements for insert to authenticated
  with check (public.has_permission('announcements:create'));
create policy announcements_update on public.announcements for update to authenticated
  using (public.has_permission('announcements:update'))
  with check (public.has_permission('announcements:update'));
create policy announcements_delete on public.announcements for delete to authenticated
  using (public.has_permission('announcements:delete'));
