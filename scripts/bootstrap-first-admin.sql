-- Ganti GANTI_EMAIL dengan email admin pertama, lalu jalankan di SQL Editor.
-- Hanya berhasil jika belum ada super admin.
do $$
declare
  uid uuid;
begin
  if exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where r.slug = 'super_admin'
  ) then
    raise exception 'Super admin sudah ada. Gunakan dashboard untuk mengelola pengguna.';
  end if;
  select id into uid from public.users where lower(email) = lower('soegenglz7@gmail.com');
  if uid is null then
    raise exception 'Email tidak ditemukan. Buat user di Authentication terlebih dahulu.';
  end if;
  update public.users set is_active = true where id = uid;
  insert into public.user_roles (user_id, role_id)
    select uid, id from public.roles where slug = 'super_admin';
end $$;
