# Known Issues, Deferred Tests, and Follow-ups

> Daftar ini hanya memuat pekerjaan yang masih tertunda atau belum diverifikasi. Portal Siswa dikeluarkan dari daftar setelah pengguna berhasil menyelesaikan simulasi pendaftaran dan login ke portal pada 2026-11-27.

**Terakhir diperbarui:** 2026-11-27  
**Branch pembaruan:** `docs/attendance-module-design`

## 1. Lifecycle siswa dan kelas

- [x] Uji browser perubahan status siswa menjadi `transferred` telah dilaporkan berhasil oleh pengguna.
- [ ] Uji alur `withdrawn` melalui UI dan verifikasi penutupan enrollment, pelepasan kapasitas, serta retensi histori.
- [ ] Uji penempatan individual, termasuk akun tanpa permission `students:view`.
- [ ] Uji kenaikan kelas massal pada tahun ajaran berikutnya, termasuk rollback ketika kapasitas tidak cukup.
- [ ] Uji kelulusan kelas XII, tanggal kelulusan, status akhir, dan riwayat status.
- [ ] Verifikasi fitur arsip dan pemulihan siswa setelah migrasi lengkap `20261127320000_student_archive.sql` dipastikan diterapkan. Kolom `archived_at` pernah ditambahkan manual; keberadaan RPC dan trigger harus diverifikasi sebelum fitur dianggap siap.
- [ ] Sebelum deployment migrasi lifecycle/arsip, cocokkan urutan migrasi dengan remote Supabase dan pastikan backup dapat digunakan.

## 2. Undangan akun guru — perlu verifikasi sebelum digunakan

- Implementasi undangan akun guru sudah digabung ke `main` melalui PR #1.
- Migrasi `20261124360000_teacher_account_invitations.sql` dan status penerapannya perlu dikonfirmasi dari migration list remote.
- Admin membuat undangan untuk email yang sama dengan `teachers.email`; token disimpan sebagai hash, berlaku 24 jam, dan dapat dicabut/diganti.
- Tautan undangan saat ini disalin admin dan dikirim melalui kanal resmi; belum ada integrasi pengiriman email otomatis.
- CI #312 dan #313 sukses: lint, typecheck, unit test, build, database assertions, dan concurrency tests.
- [ ] Browser QA token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun yang sudah memiliki role, duplikasi link, dan redirect guru/admin/siswa.
- [ ] Verifikasi role dan redirect pada domain production.
- `/ruang-guru` masih landing awal; roster kelas dan absensi belum tersedia.

## 3. Cloudflare/OpenNext dan website publik

- [ ] Jalankan preview Worker dan browser QA pada environment yang sesuai.
- [ ] Periksa responsivitas, navigasi, aksesibilitas dasar, gambar/storage, dan halaman publik/admin.
- [ ] Pastikan domain production yang digunakan aplikasi sama dengan origin redirect Auth.

## 4. Status CI dan batas verifikasi

- **CI #303:** sukses pada commit dasar audit 2026-11-26.
- Job `check`: lint, typecheck, unit test, dan build sukses.
- Job `database-tests`: migrasi serta assertion database pada PostgreSQL disposable sukses, termasuk tes konkurensi aktivasi tahun ajaran dan kapasitas kelas.
- CI bukan bukti pengiriman email nyata, browser QA production, atau penerapan migrasi ke Supabase production.
- Riwayat migrasi dan hasil verifikasi production harus diperbarui berdasarkan output CLI terbaru, bukan catatan historis.

## 5. Aturan menutup item

Pindahkan item dari daftar tertunda hanya setelah ada bukti jelas: hasil browser dari pengguna, output CLI, status CI yang cocok dengan commit, atau verifikasi konfigurasi. Catat tanggal, environment, hasil, dan cakupan uji. Jangan menghapus jejak kegagalan yang masih relevan.

## 6. Fase pengembangan berikutnya — Modul Absensi Siswa

**Status:** rancangan domain awal sudah dibuat di [attendance-module-design.md](attendance-module-design.md). Belum ada migrasi atau kode absensi.

Rancangan awal mengusulkan absensi harian per rombel, guru wali kelas sebagai pencatat, status hadir/terlambat/sakit/izin/alpa, submit dan lock, koreksi admin dengan alasan serta audit trail, rekap, dan tampilan read-only untuk siswa pada Portal Siswa.

Sebelum migrasi, kunci keputusan domain yang tercantum pada dokumen rancangan: satu atau beberapa sesi per hari, siapa pencatat, batas input mundur, status/rumus rekap, serta hak koreksi setelah submit.

## 7. Catatan keamanan dan database

- Semua data absensi harus privat; tidak ada akses anon/public.
- RLS dan pemeriksaan permission server/database wajib. Menyembunyikan tombol di UI bukan kontrol keamanan.
- Guru hanya boleh mengakses kelas yang ditugaskan melalui relasi `teacher_user_links` dan `class_groups.homeroom_teacher_id`.
- Siswa hanya boleh membaca absensi miliknya sendiri melalui relasi akun Portal Siswa.
- Mutasi sensitif dan koreksi harus atomik melalui RPC; histori koreksi tidak boleh dapat diubah/dihapus oleh role aplikasi.
- Jangan menjalankan `db push` atau mengubah Supabase production tanpa pemeriksaan migration list, review SQL, backup, dan persetujuan eksplisit pengguna.
- Project Supabase kedua tidak boleh disentuh.
