-- Koreksi default publikasi guru.
-- Data guru baru harus tetap tersembunyi sampai pengelola mempublikasikannya.
alter table public.teachers
  alter column is_published set default false;
