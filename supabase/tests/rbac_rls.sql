-- Uji RLS dasar. Jalankan di SQL Editor. Semua perubahan dibatalkan otomatis
-- (laporan ditampilkan lewat RAISE EXCEPTION di akhir).
do $$
declare
  v_super uuid := gen_random_uuid();  -- super admin
  v_editor uuid := gen_random_uuid();  -- editor aktif
  v_new uuid := gen_random_uuid();  -- akun baru (non-aktif, tanpa role)
  rid_editor uuid; rid_super uuid;
  p int := 0; f int := 0; r text := ''; n int; ok boolean;
begin
  insert into auth.users (id, instance_id, aud, role, email) values
    (v_super, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tes-super@example.test'),
    (v_editor, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tes-editor@example.test'),
    (v_new, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tes-baru@example.test');
  select id into rid_editor from public.roles where slug = 'editor';
  select id into rid_super from public.roles where slug = 'super_admin';
  update public.users set is_active = true where id in (v_super, v_editor);
  insert into public.user_roles (user_id, role_id) values (v_super, rid_super), (v_editor, rid_editor);

  -- 1. anon
  set local role anon;
  begin
    perform 1 from public.users limit 1;
    f := f + 1; r := r || E'\nGAGAL  anon bisa membaca users';
  exception when others then
    p := p + 1; r := r || E'\nlulus  anon ditolak membaca users';
  end;
  reset role;

  -- 2-4. akun baru (v_new)
  perform set_config('request.jwt.claims', json_build_object('sub', v_new, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.users;
  if n = 1 then p := p + 1; r := r || E'\nlulus  akun baru hanya melihat dirinya';
  else f := f + 1; r := r || E'\nGAGAL  akun baru melihat ' || n || ' baris users'; end if;
  begin
    update public.users set is_active = true where id = v_new;
    f := f + 1; r := r || E'\nGAGAL  akun baru bisa mengaktifkan dirinya';
  exception when others then
    p := p + 1; r := r || E'\nlulus  akun baru tidak bisa mengaktifkan dirinya';
  end;
  begin
    insert into public.user_roles (user_id, role_id) values (v_new, rid_super);
    f := f + 1; r := r || E'\nGAGAL  akun baru bisa memberi dirinya super_admin';
  exception when others then
    p := p + 1; r := r || E'\nlulus  akun baru tidak bisa memberi dirinya role';
  end;
  reset role;

  -- 5-10. editor (v_editor)
  perform set_config('request.jwt.claims', json_build_object('sub', v_editor, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := public.has_permission('news:publish');
  if ok then p := p + 1; r := r || E'\nlulus  editor punya news:publish';
  else f := f + 1; r := r || E'\nGAGAL  editor tidak punya news:publish'; end if;
  ok := public.has_permission('students:view');
  if not ok then p := p + 1; r := r || E'\nlulus  editor tidak punya students:view';
  else f := f + 1; r := r || E'\nGAGAL  editor punya students:view'; end if;
  select count(*) into n from public.users;
  if n = 1 then p := p + 1; r := r || E'\nlulus  editor hanya melihat dirinya di users';
  else f := f + 1; r := r || E'\nGAGAL  editor melihat ' || n || ' baris users'; end if;
  begin
    insert into public.user_roles (user_id, role_id) values (v_new, rid_editor);
    f := f + 1; r := r || E'\nGAGAL  editor bisa memberi role';
  exception when others then
    p := p + 1; r := r || E'\nlulus  editor tidak bisa memberi role';
  end;
  select count(*) into n from public.roles;
  if n = 0 then p := p + 1; r := r || E'\nlulus  editor tidak bisa membaca roles';
  else f := f + 1; r := r || E'\nGAGAL  editor membaca ' || n || ' baris roles'; end if;
  update public.roles set name = 'x' where slug = 'editor';
  get diagnostics n = row_count;
  if n = 0 then p := p + 1; r := r || E'\nlulus  editor tidak bisa mengubah roles';
  else f := f + 1; r := r || E'\nGAGAL  editor mengubah roles'; end if;
  reset role;

  -- 11-14. super admin (v_super)
  perform set_config('request.jwt.claims', json_build_object('sub', v_super, 'role', 'authenticated')::text, true);
  set local role authenticated;
  ok := public.has_permission('modul_apa_saja:view');
  if ok then p := p + 1; r := r || E'\nlulus  super admin lolos semua permission';
  else f := f + 1; r := r || E'\nGAGAL  super admin ditolak'; end if;
  select count(*) into n from public.users;
  if n >= 3 then p := p + 1; r := r || E'\nlulus  super admin melihat semua users';
  else f := f + 1; r := r || E'\nGAGAL  super admin hanya melihat ' || n || ' users'; end if;
  begin
    insert into public.user_roles (user_id, role_id) values (v_new, rid_editor);
    p := p + 1; r := r || E'\nlulus  super admin bisa memberi role';
  exception when others then
    f := f + 1; r := r || E'\nGAGAL  super admin ditolak memberi role';
  end;
  update public.roles set name = 'x' where slug = 'super_admin';
  get diagnostics n = row_count;
  if n = 0 then p := p + 1; r := r || E'\nlulus  role super_admin tidak bisa diubah lewat aplikasi';
  else f := f + 1; r := r || E'\nGAGAL  role super_admin berubah'; end if;
  reset role;

  raise exception E'HASIL TES RLS (semua perubahan dibatalkan): % lulus, % gagal%', p, f, r;
end $$;
