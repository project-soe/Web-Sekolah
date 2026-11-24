-- Permission ini dipakai oleh RLS publication guard pada announcements.
insert into public.permissions (code, module, action)
values ('announcements:publish', 'announcements', 'publish')
on conflict (code) do nothing;
