-- Soft-delete student master records while preserving academic and audit history.
alter table public.students
  add column archived_at timestamptz;

comment on column public.students.archived_at is
  'Waktu data siswa diarsipkan. Arsip menyembunyikan data dari daftar aktif tanpa menghapus riwayat akademik/audit.';

create or replace function public.archive_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare target_student public.students%rowtype;
begin
  if not public.has_permission('students:delete') then
    raise exception 'Tidak memiliki izin untuk mengarsipkan siswa' using errcode = '42501';
  end if;

  select * into target_student
  from public.students
  where id = p_student_id
  for update;

  if not found then
    raise exception 'Siswa tidak ditemukan' using errcode = 'P0002';
  end if;

  if target_student.archived_at is not null then
    raise exception 'Siswa sudah diarsipkan' using errcode = '23514';
  end if;

  if exists (select 1 from public.student_portal_accounts where student_id = p_student_id) then
    raise exception 'Putuskan tautan akun Portal Siswa sebelum mengarsipkan data ini' using errcode = '23514';
  end if;

  if exists (select 1 from public.student_portal_invitations where student_id = p_student_id) then
    raise exception 'Cabut atau selesaikan undangan Portal Siswa sebelum mengarsipkan data ini' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.student_class_enrollments
    where student_id = p_student_id and ended_at is null
  ) then
    raise exception 'Tutup penempatan kelas aktif melalui proses status akademik sebelum mengarsipkan siswa' using errcode = '23514';
  end if;

  update public.students set archived_at = now()
  where id = p_student_id;
end;
$function$;

create or replace function public.restore_archived_student(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.has_permission('students:update') then
    raise exception 'Tidak memiliki izin untuk memulihkan siswa' using errcode = '42501';
  end if;

  update public.students set archived_at = null
  where id = p_student_id and archived_at is not null;

  if not found then
    raise exception 'Data siswa arsip tidak ditemukan' using errcode = 'P0002';
  end if;
end;
$function$;

revoke all on function public.archive_student(uuid) from public, anon, authenticated;
revoke all on function public.restore_archived_student(uuid) from public, anon, authenticated;
grant execute on function public.archive_student(uuid) to authenticated;
grant execute on function public.restore_archived_student(uuid) to authenticated;
