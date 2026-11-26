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

**Modul Absensi Siswa** — masih tahap rekomendasi/perancangan, belum diimplementasikan.

Urutan desain yang disarankan:
1. Sepakati siapa yang boleh mencatat, mengoreksi, melihat, dan mengunci absensi.
2. Definisikan status kehadiran dan aturan izin/sakit/alpa/terlambat.
3. Tentukan keunikan pencatatan (siswa + tanggal + sesi/rombel) dan penanganan perpindahan siswa.
4. Rancang audit trail koreksi, pembatasan tanggal, serta rekap harian/bulanan.
5. Tentukan informasi yang boleh dilihat siswa pada Portal Siswa.
6. Baru susun migrasi, database tests, server actions/RPC, UI, dan dokumentasi.



## 7. Undangan akun guru — perlu verifikasi sebelum digunakan
- Implementasi awal berada pada branch `feat/teacher-account-invitations`; belum digabung ke `main` dan belum diuji CI/browser.
- Migrasi `20261124360000_teacher_account_invitations.sql` belum diterapkan ke Supabase production.
- Admin hanya dapat membuat undangan untuk email yang sama dengan `teachers.email`. Token disimpan dalam bentuk hash, berlaku 24 jam, dan dapat dicabut/diganti.
- Guru harus mendaftar dengan email undangan, menetapkan password, lalu memverifikasi email. Callback akan mengklaim undangan dan memberi role guru.
- Tautan saat ini disalin admin dan dikirim melalui kanal resmi sekolah; belum ada integrasi pengiriman email otomatis.
- Perlu uji: token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda, email belum terverifikasi, akun yang sudah memiliki role, duplikasi link, serta redirect guru/admin/siswa.
- `/ruang-guru` masih landing awal; belum menyediakan data kelas atau absensi.
- Tidak ada perubahan pada Supabase remote.


### Riwayat CI undangan guru
- CI #305 gagal pada typecheck (nilai action log `revoke`) dan database fixture (role guru belum tersedia); keduanya telah diperbaiki.
- CI #306: lint, typecheck, dan unit test sukses; database test gagal karena nilai permission fixture belum sinkron dengan `teacher_accounts:manage`. Perbaikan permission, validasi email sebelum signup, dan assertion validasi pasangan token/email sudah dibuat pada commit terbaru. Menunggu hasil CI ulang.
- CI #307: typecheck dan unit test sukses; database test gagal karena delimiter SQL pada RPC validasi undangan. Perbaikan delimiter dan grant eksplisit sudah dibuat; menunggu hasil CI terbaru.
- Audit keamanan tambahan memperluas guard trigger aktivasi akun agar link guru yang dibuat oleh RPC klaim terverifikasi menjadi prasyarat aktivasi. Assertion database kini menolak aktivasi sebelum link dan memeriksa aktivasi setelah klaim.
