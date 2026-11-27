# Known Issues, Deferred Tests, and Follow-ups

> Dokumen kerja untuk mencatat pengujian yang belum dilakukan, hasil yang belum terkonfirmasi, kendala eksternal, dan tindak lanjut. Status di sini bukan berarti semua item adalah bug aplikasi.

**Terakhir diperbarui:** 2026-11-26  
**Branch saat pencatatan:** `main`  
**Commit dasar audit:** `d5e8401541b2bafcc835e27b23ed06441fc3cbdd`


## 1. Aturan menutup item

Pindahkan item dari daftar tertunda hanya setelah ada bukti yang jelas: hasil browser dari pengguna, output CLI, status CI yang cocok dengan commit, atau verifikasi konfigurasi yang dapat diperiksa. Catat tanggal, lingkungan, hasil, dan batas cakupan uji. Jika gagal, catat gejala dan langkah reproduksi; jangan menghapus jejak kegagalan.

## 2. Kandidat fase pengembangan berikutnya

**Modul Absensi Siswa** — masih tahap rekomendasi/perancangan, belum diimplementasikan.

Urutan desain yang disarankan:
1. Sepakati siapa yang boleh mencatat, mengoreksi, melihat, dan mengunci absensi.
2. Definisikan status kehadiran dan aturan izin/sakit/alpa/terlambat.
3. Tentukan keunikan pencatatan (siswa + tanggal + sesi/rombel) dan penanganan perpindahan siswa.
4. Rancang audit trail koreksi, pembatasan tanggal, serta rekap harian/bulanan.
5. Tentukan informasi yang boleh dilihat siswa pada Portal Siswa.
6. Baru susun migrasi, database tests, server actions/RPC, UI, dan dokumentasi.



## 3. Undangan akun guru — perlu verifikasi sebelum digunakan
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
