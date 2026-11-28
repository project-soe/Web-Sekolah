-- Keep direct PostgREST writes consistent with the individual-placement server action.
-- An actor must be able to view both the class and student before changing an enrollment.
drop policy if exists student_class_enrollments_insert on public.student_class_enrollments;
create policy student_class_enrollments_insert on public.student_class_enrollments
  for insert to authenticated
  with check (
    public.has_permission('classes:view') and public.has_permission('students:view')
    and public.has_permission('classes:update') and public.has_permission('students:update')
  );
drop policy if exists student_class_enrollments_update on public.student_class_enrollments;
create policy student_class_enrollments_update on public.student_class_enrollments
  for update to authenticated
  using (
    public.has_permission('classes:view') and public.has_permission('students:view')
    and public.has_permission('classes:update') and public.has_permission('students:update')
  )
  with check (
    public.has_permission('classes:view') and public.has_permission('students:view')
    and public.has_permission('classes:update') and public.has_permission('students:update')
  );
