-- Fungsi bantu: cek salah satu dari beberapa permission.
create or replace function public.has_any_permission(perms text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_super_admin() or exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where u.id = (select auth.uid())
      and u.is_active and u.deleted_at is null
      and p.code = any (perms)
  );
$$;
revoke all on function public.has_any_permission(text[]) from public, anon;
grant execute on function public.has_any_permission(text[]) to authenticated;

create or replace function public.can_manage_media()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'school:update','teachers:create','teachers:update','departments:create','departments:update',
    'facilities:create','facilities:update','news:create','news:update','pages:create','pages:update',
    'galleries:create','galleries:update','achievements:create','achievements:update',
    'extracurriculars:create','extracurriculars:update','events:create','events:update',
    'announcements:create','announcements:update','homepage:update','social:update','users:update'
  ]);
$$;

create or replace function public.can_manage_public_docs()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_any_permission(array[
    'documents:create','documents:update','announcements:create','announcements:update'
  ]);
$$;
revoke all on function public.can_manage_media(), public.can_manage_public_docs() from public, anon;
grant execute on function public.can_manage_media(), public.can_manage_public_docs() to authenticated;

-- Bucket -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 3145728, array['image/jpeg','image/png','image/webp','image/avif']),
  ('public-docs', 'public-docs', true, 10485760, array['application/pdf']),
  ('admission-docs', 'admission-docs', false, 2097152,
     array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policy storage -----------------------------------------------------
-- Bucket publik: file bisa dibuka lewat URL, tetapi daftar file dan penulisan hanya untuk staf.
create policy media_select on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.can_manage_media());
create policy media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media' and public.can_manage_media()
    and (storage.foldername(name))[1] = any (array[
      'school','teachers','departments','facilities','news','pages','galleries',
      'achievements','extracurriculars','events','homepage','users'])
  );
create policy media_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.can_manage_media())
  with check (bucket_id = 'media' and public.can_manage_media());
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.can_manage_media());

create policy public_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'public-docs' and public.can_manage_public_docs());
create policy public_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'public-docs' and public.can_manage_public_docs());
create policy public_docs_update on storage.objects for update to authenticated
  using (bucket_id = 'public-docs' and public.can_manage_public_docs())
  with check (bucket_id = 'public-docs' and public.can_manage_public_docs());
create policy public_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'public-docs' and public.can_manage_public_docs());

-- Dokumen PPDB: privat. Unggah hanya lewat server (Fase 7). Staf hanya boleh melihat/menghapus.
create policy admission_docs_select on storage.objects for select to authenticated
  using (bucket_id = 'admission-docs' and public.has_permission('admissions:documents'));
create policy admission_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'admission-docs' and public.has_permission('admissions:delete'));

-- Activity log -------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  action text not null check (action in (
    'login','logout','create','update','delete','restore','publish',
    'verify','status_change','export','import','upload')),
  module text not null check (module ~ '^[a-z_]+$'),
  entity_type text check (char_length(entity_type) <= 60),
  entity_id text check (char_length(entity_id) <= 80),
  summary text not null check (char_length(summary) between 1 and 300),
  changes jsonb check (changes is null or pg_column_size(changes) <= 8192),
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);
create index activity_logs_module_idx on public.activity_logs (module, created_at desc);
create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;
revoke all on table public.activity_logs from anon;
revoke insert, update, delete, truncate, references, trigger on table public.activity_logs from authenticated;
create policy activity_logs_select on public.activity_logs for select to authenticated
  using (public.has_permission('logs:view'));

-- Satu-satunya jalur menulis log: user_id diambil dari sesi, kunci sensitif dibuang.
create or replace function public.log_activity(
  p_action text, p_module text, p_summary text,
  p_entity_type text default null, p_entity_id text default null, p_changes jsonb default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_changes jsonb := p_changes;
begin
  if v_uid is null or not exists (
    select 1 from public.users u
    join public.user_roles ur on ur.user_id = u.id
    where u.id = v_uid and u.is_active and u.deleted_at is null
  ) then
    raise exception 'Tidak diizinkan' using errcode = '42501';
  end if;
  if v_changes is not null and jsonb_typeof(v_changes) = 'object' then
    v_changes := v_changes - array[
      'password','token','access_token','refresh_token','secret','pin','nik','kk','service_role_key'];
  end if;
  insert into public.activity_logs (user_id, action, module, entity_type, entity_id, summary, changes)
  values (v_uid, p_action, p_module, p_entity_type, p_entity_id, p_summary, v_changes);
end $$;
revoke all on function public.log_activity(text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.log_activity(text, text, text, text, text, jsonb) to authenticated;
