# Known Issues, Deferred Tests, and Follow-ups

> Dokumen kerja untuk mencatat pengujian yang belum dilakukan, hasil yang belum terkonfirmasi, kendala eksternal, dan tindak lanjut. Status di sini bukan berarti semua item adalah bug aplikasi.

**Terakhir diperbarui:** 2026-11-26  
**Branch saat pencatatan:** `main`  
**Commit dasar audit:** `d5e8401541b2bafcc835e27b23ed06441fc3cbdd`

## 1. Ditunda oleh kendala eksternal

### Portal Siswa — email konfirmasi pendaftaran

- **Status:** Ditunda; belum dinyatakan lulus uji browser end-to-end.
- **Kendala:** Pengiriman email bawaan Supabase memiliki batas sangat rendah (catatan implementasi saat ini: 2 email/jam untuk seluruh project). Pengujian berulang dapat menghabiskan kuota project.
- **Yang sudah tersedia:** signup dua jalur (undangan admin dan daftar mandiri), callback `/auth/callback`, pemulihan pengajuan setelah konfirmasi, permintaan kirim ulang, serta countdown minimum 60 detik.
- **Batasan penting:** countdown 60 detik adalah kontrol pengalaman pengguna, bukan pengganti rate limit server/provider dan bukan jaminan email akan terkirim.
- **Tindak lanjut:** jangan melakukan percobaan email berulang. Ketika siap, evaluasi konfigurasi SMTP kustom yang sesuai anggaran atau tunggu kuota provider tersedia; lalu lakukan satu rangkaian uji terkontrol.

## 2. Verifikasi production dan browser yang masih perlu dilakukan

### Portal Siswa

- [ ] Uji tautan konfirmasi pada domain production dan pastikan tidak kembali ke `localhost`.
- [ ] Pastikan Supabase Auth **Site URL** memakai domain production dan **Redirect URLs** mengizinkan URL callback `/auth/callback` yang tepat.
- [ ] Uji alur undangan admin: buat token, gunakan token, tetapkan password, klaim undangan, dan login ke `/portal`.
- [ ] Uji daftar mandiri setelah email tersedia: konfirmasi email, lanjutkan pengajuan, pastikan request muncul di `/admin/akses-siswa`, lalu uji approve/reject.
- [ ] Uji token salah/kedaluwarsa, identitas tidak cocok, akun sudah tertaut, serta pemulihan pengajuan.
- [ ] Uji kirim ulang email secara terbatas dan pastikan pesan rate-limit tidak mendorong signup berulang.

### Lifecycle siswa dan kelas

- [x] Uji browser perubahan status siswa menjadi `transferred` telah dilaporkan berhasil oleh pengguna.
- [ ] Uji alur `withdrawn` melalui UI dan verifikasi penutupan enrollment, pelepasan kapasitas, serta retensi histori.
- [ ] Uji penempatan individual, termasuk akun tanpa permission `students:view`.
- [ ] Uji kenaikan kelas massal pada tahun ajaran berikutnya, termasuk rollback ketika kapasitas tidak cukup.
- [ ] Uji kelulusan kelas XII, tanggal kelulusan, status akhir, dan riwayat status.
- [ ] Sebelum deployment migrasi lifecycle, cocokkan seluruh urutan migrasi dengan remote Supabase dan pastikan backup dapat digunakan. Status CI disposable tidak membuktikan migrasi production telah diterapkan.

### Cloudflare/OpenNext dan website publik

- [ ] Jalankan preview Worker dan browser QA pada environment yang sesuai.
- [ ] Periksa responsivitas, navigasi, aksesibilitas dasar, gambar/storage, dan halaman publik/admin.
- [ ] Pastikan domain production yang digunakan aplikasi sama dengan origin redirect Auth.

## 3. Status CI terakhir

- **CI #303:** sukses pada commit dasar audit.
- Job `check`: lint, typecheck, unit test, dan build sukses.
- Job `database-tests`: migrasi serta assertion database pada PostgreSQL disposable sukses, termasuk tes konkurensi aktivasi tahun ajaran dan kapasitas kelas.
- **Bukan bukti:** CI tidak mengirim email nyata, tidak menguji browser production, dan tidak menerapkan migrasi ke Supabase production.

## 4. Catatan migrasi database

- Progress historis mencatat migrasi lifecycle siswa `2900`–`3300` belum diterapkan ke production pada pemeriksaan 2026-11-25.
- Progress historis juga mencatat migrasi Portal Siswa `3400` dan hardening `3500` belum diterapkan oleh asisten. Status remote terkini harus diperiksa ulang; jangan mengasumsikan masih pending ataupun sudah diterapkan.
- Sebelum tindakan apa pun, jalankan pemeriksaan migration list remote pada project Website Sekolah yang benar, tinjau selisih Local/Remote, pastikan backup, lalu minta persetujuan eksplisit pengguna.
- Jangan menjalankan SQL secara manual atau `db push` bila ada versi tak dikenal atau riwayat yang tidak sinkron.
- Project Supabase kedua tidak boleh disentuh.

## 5. Aturan menutup item

Pindahkan item dari daftar tertunda hanya setelah ada bukti yang jelas: hasil browser dari pengguna, output CLI, status CI yang cocok dengan commit, atau verifikasi konfigurasi yang dapat diperiksa. Catat tanggal, lingkungan, hasil, dan batas cakupan uji. Jika gagal, catat gejala dan langkah reproduksi; jangan menghapus jejak kegagalan.

## 6. Kandidat fase pengembangan berikutnya

**Modul Absensi Siswa** — implementasi awal berada pada branch `feat/student-attendance`; belum digabung dan belum diterapkan ke production.

- Aturan domain sudah disepakati dan dikunci: wali kelas mengisi/finalisasi per rombel; kalender admin menentukan hari sekolah; terlambat terpisah; koreksi pasca-finalisasi wajib beralasan; status kosong tidak otomatis menjadi Alpa.
- Migrasi `20261124370000_student_attendance.sql` dan UI admin/guru/siswa sudah disiapkan pada branch.
- Database tests ditambahkan untuk kalender, pembatasan wali kelas, snapshot roster, finalisasi, koreksi/audit, dan privasi siswa. Menunggu CI.
- Browser QA belum dilakukan. Migrasi belum diterapkan ke Supabase production.
- Jangan menjalankan `db push` tanpa persetujuan eksplisit pengguna.



## 7. Undangan akun guru — perlu verifikasi sebelum digunakan
- Implementasi undangan akun guru sudah digabung ke `main` melalui PR #1 (commit `7ec5cf7589c351f49e4fedddc106c074faf66a02`).
- Migrasi `20261124360000_teacher_account_invitations.sql` belum diterapkan ke Supabase production.
- Admin hanya dapat membuat undangan untuk email yang sama dengan `teachers.email`. Token disimpan dalam bentuk hash, berlaku 24 jam, dan dapat dicabut/diganti.
- Guru harus mendaftar dengan email undangan, menetapkan password, lalu memverifikasi email. Callback akan mengklaim undangan dan memberi role guru.
- Tautan saat ini disalin admin dan dikirim melalui kanal resmi sekolah; belum ada integrasi pengiriman email otomatis.
- CI #312 dan #313 sukses: lint, typecheck, unit test, build, database assertions, dan concurrency tests. Browser QA tetap diperlukan untuk token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun yang sudah memiliki role, duplikasi link, dan redirect guru/admin/siswa.
- `/ruang-guru` masih landing awal; belum menyediakan data kelas atau absensi.
- Tidak ada perubahan pada Supabase remote.


### Riwayat CI undangan guru
- CI #305 gagal pada typecheck (nilai action log `revoke`) dan database fixture (role guru belum tersedia); keduanya telah diperbaiki.
- CI #306: lint, typecheck, dan unit test sukses; database test gagal karena nilai permission fixture belum sinkron dengan `teacher_accounts:manage`. Perbaikan permission, validasi email sebelum signup, dan assertion validasi pasangan token/email sudah dibuat pada commit terbaru. Menunggu hasil CI ulang.
- CI #307: typecheck dan unit test sukses; database test gagal karena delimiter SQL pada RPC validasi undangan. Perbaikan delimiter dan grant eksplisit sudah dibuat; menunggu hasil CI terbaru.
- Audit keamanan tambahan memperluas guard trigger aktivasi akun agar link guru yang dibuat oleh RPC klaim terverifikasi menjadi prasyarat aktivasi. Assertion database kini menolak aktivasi sebelum link dan memeriksa aktivasi setelah klaim.
- CI #309: database job gagal di bootstrap trigger fixture (delimiter dollar-quote). Sudah diganti delimiter bernama; menunggu pemeriksaan ulang.
- Fixture database kini memberi grant UPDATE pada profil akun dan memverifikasi trigger menolak aktivasi mandiri sebelum `teacher_user_links` tersedia; hasil CI ulang masih ditunggu.
- CI #311: uji pra-klaim berhasil mencapai guard, tetapi pemeriksaan status sesudahnya gagal karena fixture tidak memberi SELECT users. Pemeriksaan status dipindahkan ke role reset; menunggu CI ulang.
- **CI #312 sukses** pada commit `0da2e49b687fe89a0091a01cad3bb2e2ccc1ffae`: lint, typecheck, unit test, build, seluruh assertion migrasi database, dan dua concurrency tests lulus. Browser QA dan verifikasi Supabase production masih belum dilakukan.


### Status setelah merge undangan guru
- Kode dan migrasi sudah ada di `main`; migrasi `20261124360000_teacher_account_invitations.sql` belum diterapkan ke Supabase production.
- CI #312 (commit kode) dan #313 (head PR final) seluruhnya sukses.
- Belum dilakukan browser QA email konfirmasi pada domain production.
- Belum ada email undangan otomatis; admin menyalin tautan dan mengirim melalui kanal sekolah.
- `/ruang-guru` masih landing awal, tanpa roster dan absensi.


## 8. Modul Absensi Siswa — status implementasi
- Branch kerja: `feat/student-attendance`.
- File utama: migrasi `20261124370000_student_attendance.sql`, actions/schema `src/features/attendance/`, halaman admin kalender/laporan, halaman `/ruang-guru/absensi`, dan tampilan Portal Siswa.
- Kalender mendukung `school_day`, `holiday`, `special_school_day`, dan `special_holiday`. Sesi hanya dibuat pada dua jenis hari sekolah.
- Snapshot roster dibuat saat sesi dibuat, menggunakan `student_class_history` dan `student_status_history`; snapshot tidak berubah setelah siswa pindah kelas.
- Finalisasi mewajibkan semua siswa ditandai. Koreksi hanya melalui RPC admin berizin dengan alasan dan audit nilai lama/baru.
- Siswa hanya dapat membaca catatan miliknya yang sudah difinalisasi.
- **CI #319 sukses** pada commit `f18b7e2992359d8360d85660001c833d01560055`: lint, typecheck, unit test, build, dan database tests lulus. Browser QA masih menunggu. Tidak ada migrasi production yang dijalankan.


### Hasil CI awal Modul Absensi — perlu tindak lanjut
- CI pertama pada branch `feat/student-attendance` gagal di job `check` pada typecheck: dua callback `map` tidak memiliki tipe eksplisit dan action kalender mengakses `parsed.data` sebelum narrowing TypeScript.
- Job `database-tests` berhenti pada assertion kalender karena fixture tidak menyertakan `classes:view` saat memanggil RPC aktivasi tahun ajaran.
- Perbaikan typecheck, permission fixture, dan pembatasan RLS agar siswa hanya melihat absensi final sedang disiapkan.
- Jangan anggap fitur lulus sebelum seluruh job CI ulang berhasil.


- Navigasi admin untuk Kalender Pendidikan/Laporan Absensi dan pintasan Ruang Guru ditambahkan pada commit perbaikan berikutnya; CI ulang akan memverifikasi.


- Audit lanjutan menutup akses SELECT langsung siswa ke tabel `attendance_records`; riwayat siswa hanya melalui RPC pemilik yang memfilter sesi final. Assertion database diperbarui untuk memastikan batas ini.


### Verifikasi ulang Modul Absensi
- CI #319 pada commit `f18b7e2992359d8360d85660001c833d01560055` sukses pada kedua job.
- Assertion database memastikan siswa tidak dapat membaca tabel absensi secara langsung; RPC `my_attendance_records()` hanya menampilkan catatan milik siswa tersebut dari sesi final.
- PR #2 masih draft, belum digabung, dan migrasi belum diterapkan ke Supabase production.
- Browser QA tetap diperlukan untuk kalender admin, alur wali kelas, finalisasi, koreksi admin, dan riwayat siswa.


- Penguatan audit: koreksi setelah finalisasi tidak lagi menimpa `recorded_by`/`recorded_at` milik wali kelas. Identitas dan waktu koreksi tetap dicatat di `attendance_change_logs`; assertion database memverifikasi keduanya.
