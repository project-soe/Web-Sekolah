-- Ringkasan bulanan absensi final untuk admin; draft tidak masuk statistik.
create or replace function public.admin_attendance_monthly_summary(p_month date)
returns table(
 class_group_id uuid,
 class_name text,
 academic_year text,
 session_count bigint,
 student_day_count bigint,
 present_count bigint,
 late_count bigint,
 sick_count bigint,
 excused_count bigint,
 absent_count bigint,
 attendance_percentage numeric
)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not public.has_permission('attendance:view_all') then
  raise exception 'Tidak memiliki izin melihat rekap absensi' using errcode='42501';
 end if;
 if p_month is null or extract(day from p_month) <> 1 then
  raise exception 'Bulan rekap harus berupa tanggal hari pertama bulan' using errcode='22023';
 end if;

 return query
 select
  cg.id,
  cg.name,
  ay.name,
  count(distinct s.id)::bigint,
  count(e.id)::bigint,
  count(e.id) filter (where e.status='present')::bigint,
  count(e.id) filter (where e.status='late')::bigint,
  count(e.id) filter (where e.status='sick')::bigint,
  count(e.id) filter (where e.status='excused')::bigint,
  count(e.id) filter (where e.status='absent')::bigint,
  round(
   100.0 * count(e.id) filter (where e.status in ('present','late'))
   / nullif(count(e.id),0),
   2
  )
 from public.attendance_sessions s
 join public.class_groups cg on cg.id=s.class_group_id
 join public.academic_years ay on ay.id=s.academic_year_id
 join public.attendance_entries e on e.session_id=s.id
 where s.status in ('submitted','locked')
  and s.attendance_date >= p_month
  and s.attendance_date < (p_month + interval '1 month')::date
 group by cg.id,cg.name,ay.name
 order by cg.name;
end
$$;

revoke all on function public.admin_attendance_monthly_summary(date) from public,anon;
grant execute on function public.admin_attendance_monthly_summary(date) to authenticated;
comment on function public.admin_attendance_monthly_summary(date) is
 'Rekap bulanan per rombel. Persentase hadir menghitung present dan late dibanding seluruh status tercatat pada sesi submitted/locked.';
