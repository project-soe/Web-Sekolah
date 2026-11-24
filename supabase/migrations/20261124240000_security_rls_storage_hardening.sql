-- Harden public read policies, publication transitions, gallery image access,
-- and folder-level authorization for the public media bucket.

-- Public reads must not depend on staff permission functions.
drop policy if exists news_select on public.news;
create policy news_public_select on public.news
  for select to anon
  using (status = 'published' and published_at <= now());
create policy news_staff_select on public.news
  for select to authenticated
  using (
    (status = 'published' and published_at <= now())
    or public.has_permission('news:view')
  );

drop policy if exists news_categories_select on public.news_categories;
create policy news_categories_public_select on public.news_categories
  for select to anon
  using (
    exists (
      select 1 from public.news n
      where n.category_id = news_categories.id
        and n.status = 'published'
        and n.published_at <= now()
    )
  );
create policy news_categories_staff_select on public.news_categories
  for select to authenticated
  using (
    public.has_permission('news:view')
    or exists (
      select 1 from public.news n
      where n.category_id = news_categories.id
        and n.status = 'published'
        and n.published_at <= now()
    )
  );

drop policy if exists teachers_select on public.teachers;
create policy teachers_public_select on public.teachers
  for select to anon using (is_published);
create policy teachers_staff_select on public.teachers
  for select to authenticated
  using (is_published or public.has_permission('teachers:view'));

drop policy if exists departments_select on public.departments;
create policy departments_public_select on public.departments
  for select to anon using (is_published);
create policy departments_staff_select on public.departments
  for select to authenticated
  using (is_published or public.has_permission('departments:view'));

drop policy if exists facilities_select on public.facilities;
create policy facilities_public_select on public.facilities
  for select to anon using (is_published);
create policy facilities_staff_select on public.facilities
  for select to authenticated
  using (is_published or public.has_permission('facilities:view'));

drop policy if exists announcements_select on public.announcements;
create policy announcements_public_select on public.announcements
  for select to anon
  using (
    status = 'published'
    and published_at <= now()
    and (expires_at is null or expires_at > now())
  );
create policy announcements_staff_select on public.announcements
  for select to authenticated
  using (
    (
      status = 'published'
      and published_at <= now()
      and (expires_at is null or expires_at > now())
    )
    or public.has_permission('announcements:view')
  );

-- Updating an already-published item or publishing a new one requires :publish.
drop policy if exists news_update on public.news;
create policy news_update on public.news
  for update to authenticated
  using (
    public.has_permission('news:update')
    and (status <> 'published' or public.has_permission('news:publish'))
  )
  with check (
    public.has_permission('news:update')
    and (status <> 'published' or public.has_permission('news:publish'))
  );

drop policy if exists announcements_update on public.announcements;
create policy announcements_update on public.announcements
  for update to authenticated
  using (
    public.has_permission('announcements:update')
    and (status <> 'published' or public.has_permission('announcements:publish'))
  )
  with check (
    public.has_permission('announcements:update')
    and (status <> 'published' or public.has_permission('announcements:publish'))
  );

drop policy if exists galleries_update on public.galleries;
create policy galleries_update on public.galleries
  for update to authenticated
  using (
    public.has_permission('galleries:update')
    and (status <> 'published' or public.has_permission('galleries:publish'))
  )
  with check (
    public.has_permission('galleries:update')
    and (status <> 'published' or public.has_permission('galleries:publish'))
  );

-- A SECURITY DEFINER helper checks the parent album without depending on
-- caller-visible gallery rows, and applies publication permission to images.
create or replace function public.can_manage_gallery_images(target_gallery_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
      select 1
      from public.galleries g
      where g.id = target_gallery_id
        and (
          g.status <> 'published'
          or public.has_permission('galleries:publish')
        )
    );
$function$;

revoke all on function public.can_manage_gallery_images(uuid) from public, anon;
grant execute on function public.can_manage_gallery_images(uuid) to authenticated;

drop policy if exists gallery_images_insert on public.gallery_images;
create policy gallery_images_insert on public.gallery_images
  for insert to authenticated
  with check (
    public.has_permission('galleries:update')
    and public.can_manage_gallery_images(gallery_id)
  );

drop policy if exists gallery_images_update on public.gallery_images;
create policy gallery_images_update on public.gallery_images
  for update to authenticated
  using (
    public.has_permission('galleries:update')
    and public.can_manage_gallery_images(gallery_id)
  )
  with check (
    public.has_permission('galleries:update')
    and public.can_manage_gallery_images(gallery_id)
  );

drop policy if exists gallery_images_delete on public.gallery_images;
create policy gallery_images_delete on public.gallery_images
  for delete to authenticated
  using (
    (
      public.has_permission('galleries:update')
      or public.has_permission('galleries:delete')
    )
    and public.can_manage_gallery_images(gallery_id)
  );

-- Replace the cross-module media permission union with folder-aware checks.
create or replace function public.can_manage_media_folder(folder_name text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select case folder_name
    when 'school' then public.has_permission('school:update')
    when 'teachers' then public.has_any_permission(array[
      'teachers:create','teachers:update','teachers:delete'
    ])
    when 'departments' then public.has_any_permission(array[
      'departments:create','departments:update','departments:delete'
    ])
    when 'facilities' then public.has_any_permission(array[
      'facilities:create','facilities:update','facilities:delete'
    ])
    when 'news' then public.has_any_permission(array[
      'news:create','news:update','news:delete'
    ])
    when 'pages' then public.has_any_permission(array[
      'pages:create','pages:update'
    ])
    when 'galleries' then public.has_any_permission(array[
      'galleries:create','galleries:update','galleries:delete'
    ])
    when 'achievements' then public.has_any_permission(array[
      'achievements:create','achievements:update','achievements:delete'
    ])
    when 'extracurriculars' then public.has_any_permission(array[
      'extracurriculars:create','extracurriculars:update'
    ])
    when 'events' then public.has_any_permission(array[
      'events:create','events:update','events:delete'
    ])
    when 'homepage' then public.has_permission('homepage:update')
    when 'users' then public.has_permission('users:update')
    else false
  end;
$function$;

revoke all on function public.can_manage_media_folder(text) from public, anon;
grant execute on function public.can_manage_media_folder(text) to authenticated;

drop policy if exists media_insert on storage.objects;
create policy media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.can_manage_media_folder((storage.foldername(name))[1])
  );

drop policy if exists media_select on storage.objects;
create policy media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'media'
    and public.can_manage_media_folder((storage.foldername(name))[1])
  );

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.can_manage_media_folder((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'media'
    and public.can_manage_media_folder((storage.foldername(name))[1])
  );

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and public.can_manage_media_folder((storage.foldername(name))[1])
  );
