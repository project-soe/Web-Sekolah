-- Perkuat publikasi: perubahan status published selalu membutuhkan permission publish.
drop policy if exists news_insert on public.news;
drop policy if exists news_update on public.news;
create policy news_insert on public.news for insert to authenticated
  with check (
    public.has_permission('news:create')
    and (status <> 'published' or public.has_permission('news:publish'))
  );
create policy news_update on public.news for update to authenticated
  using (public.has_permission('news:update'))
  with check (
    public.has_permission('news:update')
    and (status <> 'published' or public.has_permission('news:publish'))
  );

drop policy if exists announcements_insert on public.announcements;
drop policy if exists announcements_update on public.announcements;
create policy announcements_insert on public.announcements for insert to authenticated
  with check (
    public.has_permission('announcements:create')
    and (status <> 'published' or public.has_permission('announcements:publish'))
  );
create policy announcements_update on public.announcements for update to authenticated
  using (public.has_permission('announcements:update'))
  with check (
    public.has_permission('announcements:update')
    and (status <> 'published' or public.has_permission('announcements:publish'))
  );

drop policy if exists galleries_insert on public.galleries;
create policy galleries_insert on public.galleries for insert to authenticated
  with check (
    public.has_permission('galleries:create')
    and (status <> 'published' or public.has_permission('galleries:publish'))
  );
