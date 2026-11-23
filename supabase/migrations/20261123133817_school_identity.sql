create table public.school_settings (
  id boolean primary key default true check (id),
  name text not null default 'Nama Sekolah' check (char_length(name) between 2 and 150),
  slogan text check (char_length(slogan) <= 200),
  npsn text check (npsn ~ '^[0-9]{8}$'),
  nss text check (char_length(nss) <= 20),
  ownership text check (ownership in ('negeri', 'swasta')),
  education_level text check (education_level in ('SD','SMP','SMA','SMK','MI','MTs','MA','Lainnya')),
  accreditation text check (char_length(accreditation) <= 30),
  founded_year smallint check (founded_year between 1800 and 2100),
  headmaster_name text check (char_length(headmaster_name) <= 150),
  address text check (char_length(address) <= 300),
  kecamatan text check (char_length(kecamatan) <= 100),
  kabupaten_kota text check (char_length(kabupaten_kota) <= 100),
  provinsi text check (char_length(provinsi) <= 100),
  postal_code text check (postal_code ~ '^[0-9]{5}$'),
  phone text check (char_length(phone) <= 30),
  whatsapp text check (char_length(whatsapp) <= 30),
  email text check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  website text check (website ~* '^https?://'),
  logo_path text,
  hero_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.school_profiles (
  id boolean primary key default true check (id),
  vision text check (char_length(vision) <= 2000),
  mission text check (char_length(mission) <= 5000),
  history text check (char_length(history) <= 10000),
  objectives text check (char_length(objectives) <= 5000),
  headmaster_message text check (char_length(headmaster_message) <= 5000),
  headmaster_photo_path text,
  org_structure_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger school_settings_updated_at before update on public.school_settings
  for each row execute function public.set_updated_at();
create trigger school_profiles_updated_at before update on public.school_profiles
  for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.school_settings (id) values (true) on conflict do nothing;
insert into public.school_profiles (id) values (true) on conflict do nothing;

revoke all on table public.school_settings, public.school_profiles, public.site_settings
  from anon, authenticated;
grant select on public.school_settings, public.school_profiles, public.site_settings
  to anon, authenticated;
grant update on public.school_settings, public.school_profiles to authenticated;
grant insert, update, delete on public.site_settings to authenticated;

alter table public.school_settings enable row level security;
alter table public.school_profiles enable row level security;
alter table public.site_settings enable row level security;

-- Identitas dan profil sekolah memang informasi publik. Penulisan hanya untuk yang berwenang.
create policy school_settings_select on public.school_settings for select to anon, authenticated
  using (true);
create policy school_settings_update on public.school_settings for update to authenticated
  using (public.has_permission('school:update'))
  with check (public.has_permission('school:update'));

create policy school_profiles_select on public.school_profiles for select to anon, authenticated
  using (true);
create policy school_profiles_update on public.school_profiles for update to authenticated
  using (public.has_permission('school:update'))
  with check (public.has_permission('school:update'));

create policy site_settings_select on public.site_settings for select to anon, authenticated
  using (is_public or public.has_permission('settings:view'));
create policy site_settings_insert on public.site_settings for insert to authenticated
  with check (public.has_permission('settings:update'));
create policy site_settings_update on public.site_settings for update to authenticated
  using (public.has_permission('settings:update'))
  with check (public.has_permission('settings:update'));
create policy site_settings_delete on public.site_settings for delete to authenticated
  using (public.has_permission('settings:update'));
