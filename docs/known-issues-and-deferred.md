# Known Issues, Deferred Tests, and Follow-ups

> Hanya pekerjaan yang masih tertunda atau belum diverifikasi. Portal Siswa dikeluarkan dari daftar uji pendaftaran setelah pengguna mengonfirmasi simulasi pendaftaran berhasil dan dapat login pada 2026-11-27.

**Terakhir diperbarui:** 2026-11-28

## 1. Lifecycle siswa dan kelas

- [x] Uji browser perubahan status siswa menjadi transferred dilaporkan berhasil.
- [ ] Uji alur withdrawn melalui UI dan verifikasi penutupan enrollment, pelepasan kapasitas, serta retensi histori.
- [x] Regression test database penempatan individual: INSERT/UPDATE ditolak tanpa permission `students:view` dan `classes:view`; PR #19 menambahkan guard RLS.
- [ ] Browser QA penempatan individual melalui dashboard, termasuk akun tanpa permission `students:view`.
- [ ] Uji kenaikan kelas massal pada tahun ajaran berikutnya, termasuk rollback saat kapasitas tidak cukup.
- [ ] Uji kelulusan kelas XII, tanggal kelulusan, status akhir, dan riwayat status.
- [ ] Verifikasi fitur arsip/pemulihan siswa setelah migrasi lengkap 20261127320000_student_archive.sql diterapkan. Kolom archived_at pernah ditambahkan manual; pastikan RPC dan trigger tersedia.

## 2. Modul Absensi Siswa

- [x] PR #12 sudah merged; CI #367 sukses pada head commit PR (lint, typecheck, unit test, build, database assertions, dan concurrency tests).
- [ ] Browser QA pencatatan guru: kelas wali yang benar, draft parsial, submit lengkap, dan pemilihan tanggal hari ini hingga 7 hari sebelumnya. Pemilih tanggal sudah tersedia di main melalui PR #13; uji browser dengan akun wali kelas masih diperlukan.
- [x] Browser QA admin: tab Absensi tampil di dashboard dan rekap harian termuat (dikonfirmasi pengguna, 2026-11-28).
- [ ] Browser QA admin lanjutan: koreksi dengan alasan, lock dan unlock.
- [ ] Browser QA Portal Siswa: hanya riwayat siswa yang sedang login yang tampil.
- [ ] Verifikasi migration list remote, review SQL, dan pastikan backup sebelum menerapkan 20261127330000_student_daily_attendance.sql ke Supabase production. Migrasi belum diterapkan.
- [x] Rekap bulanan per rombel, filter bulan, distribusi status, dan persentase hadir sudah merged melalui PR #16; pengguna mengonfirmasi migration `20261128090000_student_attendance_monthly_summary.sql` sudah dideploy.
- [ ] Browser QA rekap bulanan: ganti bulan, validasi angka per rombel, dan pastikan draft tidak masuk statistik.
- [x] Ekspor CSV rekap bulanan sudah merged melalui PR #17 (merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`); CI hijau dikonfirmasi pengguna.\n- [ ] Browser QA ekspor CSV: unduh dari dashboard, cocokkan isi dengan rekap bulan terpilih, dan buka file pada spreadsheet.
- [ ] Kalender libur dan absensi per mata pelajaran tetap opsi pengembangan berikutnya.

## 3. Undangan akun guru

- [ ] Browser QA token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun yang sudah memiliki role, duplikasi link, serta redirect role.
- [ ] Verifikasi migrasi 20261124360000_teacher_account_invitations.sql pada Supabase production.
- Tautan undangan saat ini disalin admin dan dikirim melalui kanal resmi; belum ada email otomatis.

## 4. Cloudflare/OpenNext dan website publik

- [ ] Jalankan preview Worker dan browser QA pada environment yang sesuai.
- [ ] Periksa responsivitas, navigasi, aksesibilitas dasar, gambar/storage, serta halaman publik/admin.
- [ ] Pastikan domain production sama dengan origin redirect Auth.

## 5. CI dan database production

- CI disposable bukan bukti email nyata, browser QA production, atau migrasi sudah diterapkan ke Supabase production.
- Sebelum tindakan database: periksa migration list remote pada project Website Sekolah yang benar, review SQL, pastikan backup, dan minta persetujuan eksplisit.
- Jangan menjalankan SQL manual atau db push jika riwayat migrasi tidak sinkron. Jangan menyentuh project Supabase kedua.

## 6. Aturan menutup item

Pindahkan item dari daftar tertunda hanya setelah ada bukti: hasil browser dari pengguna, output CLI, status CI pada commit yang benar, atau verifikasi konfigurasi. Catat tanggal, environment, hasil, dan cakupan uji. Jangan menghapus jejak kegagalan yang masih relevan.

## Referensi

- Rancangan dan keputusan domain: attendance-module-design.md.
- Catatan serah terima: progress.md.


### Pembaruan 2026-11-28 — Rekap bulanan
- PR #15 dan PR #16 telah merged; pengguna mengonfirmasi CI #375 hijau dan migrasi rekap bulanan sudah dideploy.
- Rekap bulanan dan definisi persentase tidak lagi menjadi pekerjaan implementasi tertunda; browser QA bulan/angka tetap menunggu.
- Ekspor CSV sedang dikerjakan pada branch `feat/attendance-monthly-csv-export`.


### Pembaruan 2026-11-28 — Ekspor CSV dan lifecycle siswa
- PR #17 ekspor CSV sudah merged; pengguna mengonfirmasi CI hijau. Browser QA unduhan dan isi file tetap tertunda.
- Berikutnya ditambahkan regression test database untuk alur withdrawn: penutupan enrollment aktif, pelepasan kapasitas, serta retensi histori.
