### Hardening formula injection CSV — 2026-11-28
- Mitigasi formula injection pada ekspor CSV diperluas dari whitespace ASCII menjadi whitespace Unicode, termasuk NBSP, ideographic space, dan BOM sebelum karakter formula.
- Regression unit tests ditambahkan untuk memastikan nilai teks tetap diperlakukan sebagai teks saat dibuka di spreadsheet.
- CI dan browser QA unduhan tetap menunggu hasil verifikasi.

### Validasi payload RPC absensi pada database — 2026-11-28
- RPC `save_class_attendance` diperketat agar payload NULL/non-array, elemen non-object, siswa duplikat, status tidak dikenal, dan catatan lebih dari 500 karakter ditolak walaupun RPC dipanggil langsung.
- Regression tests database mencakup bypass server action untuk kasus payload malformed.
- Migration baru hanya ada di repository/PR; belum diterapkan ke Supabase production. Rekonsiliasi migration history, backup, dan persetujuan tetap wajib.

### Hardening server action absensi guru — 2026-11-28
- Input tanggal kini harus merupakan tanggal kalender nyata; status siswa dibatasi ke nilai domain, ID siswa harus UUID, field siswa duplikat ditolak, dan catatan maksimal 500 karakter.
- Regression test server action guru mencakup validasi input, autentikasi/permission, payload RPC, serta urutan penyimpanan draft sebelum submit.
- Perubahan hanya pada validasi server dan unit tests; tidak ada migrasi atau perubahan database production.

### Hardening validasi lock/unlock absensi — 2026-11-28
- Server action kini menolak nilai `locked` selain literal `true`/`false`, agar input malformed tidak ditafsirkan sebagai unlock.
- Alasan unlock wajib 5–500 karakter; alasan lock opsional dan maksimal 500 karakter.
- Regression test ditambahkan untuk state tidak dikenal dan alasan melebihi batas. Tidak ada perubahan database atau migrasi.

### Pembaruan regression test aksi admin absensi — 2026-11-28
- Branch `test/attendance-admin-actions` menambahkan unit test untuk validasi input, autentikasi, permission, payload RPC, normalisasi alasan koreksi, serta lock/unlock.
- Test ini melengkapi database lifecycle assertions yang sudah ada; tidak mengubah kode produksi atau database.
- Hasil CI PR masih menunggu. Browser QA koreksi dan lock/unlock tetap perlu dilakukan secara terpisah.

### Pembaruan PR #32 dan hardening CSV — 2026-11-28
- PR #32 sudah merged setelah CI #437 hijau; pengujian endpoint ekspor memeriksa BOM dari raw response bytes karena `Response.text()` menghapus BOM saat decoding.
- Tindak lanjut regression coverage CSV pada PR #33: menguji formula prefix `=`, `+`, `-`, dan `@`, termasuk ketika didahului whitespace/control characters serta nilai numerik yang diterima sebagai string.
- Browser QA unduhan CSV dan pencocokan isi file dengan rekap bulan terpilih tetap tertunda.

### Pembaruan PR #31 — 2026-11-28
- Regression test riwayat absensi Portal Siswa sudah merged; akun tertaut hanya membaca riwayat miliknya dan sesi final (`submitted`/`locked`), sedangkan sesi `draft` tidak tampil.
- Merge commit: `6a2b08df11521eb524aa86325570ee3cafedb244`.
- PR #32 menambahkan cakupan unit test route ekspor CSV; hasil CI masih menunggu.
- Browser QA riwayat Portal Siswa, rekap bulanan, dan unduhan CSV tetap terpisah dan belum dikonfirmasi.

# Known Issues, Deferred Tests, and Follow-ups

> Hanya pekerjaan yang masih tertunda atau belum diverifikasi. Portal Siswa dikeluarkan dari daftar uji pendaftaran setelah pengguna mengonfirmasi simulasi pendaftaran berhasil dan dapat login pada 2026-11-27.

**Terakhir diperbarui:** 2026-11-28

### Pembaruan QA menu Kelas — 2026-11-28
- PR #28 sudah merged; pengguna mengonfirmasi browser QA form penempatan siswa aktif pada halaman `/admin/kelas` dan detail rombel berhasil.
- Halaman detail rombel `/admin/kelas/[id]` sekarang menyediakan form penempatan langsung untuk siswa aktif, hanya pada tahun ajaran aktif dan dengan permission `classes:update`, `students:view`, serta `students:update`.
- Setelah penempatan dari detail rombel, pengguna kembali ke rombel yang sama; pesan sukses dan kegagalan ditampilkan pada halaman tersebut.
- Ditemukan dan dibersihkan literal `\\n` sebelum komponen ringkasan di halaman detail kelas. Pemeriksaan source search tidak menemukan literal serupa lain di area menu/halaman Kelas.
- Browser QA PR #28 berhasil menurut konfirmasi pengguna. Tidak ada migrasi atau perubahan database production.


### Pembaruan PR #28 — 2026-11-28
- PR #28 sudah merged ke `main` (merge commit `4dea7b4e7f7d2424b3f77c7cbdc24cf384d7ba12`).
- Pengguna mengonfirmasi seluruh browser QA penempatan siswa aktif dan perbaikan tampilan menu Kelas berhasil.
- Form tersedia di daftar kelas dan detail rombel; pilihan hanya siswa aktif/tidak diarsipkan, dengan validasi permission dan tahun ajaran.
- Tidak ada migrasi atau perubahan database production.

### Temuan browser QA absensi guru — 2026-11-28
- Pengguna berhasil masuk ke `/ruang-guru` melalui undangan admin, tetapi roster absensi kosong pada 2026-11-28.
- Pengguna melaporkan pemilih tanggal selalu kembali ke 2026-11-28 ketika memilih tanggal 21–27 November.
- Audit kode: roster hanya menampilkan rombel yang `class_groups.homeroom_teacher_id` cocok dengan `teacher_user_links.teacher_id` untuk akun login, serta siswa yang masih aktif dan memiliki enrollment aktif.
- Admin dapat memeriksa penugasan melalui **Admin → Kelas → pilih rombel → Edit data kelas → Wali kelas**. Pastikan profil guru yang diundang dipilih dan siswa aktif sudah ditempatkan pada rombel.
- PR perbaikan pemilih tanggal terkontrol dan pesan empty-state sedang disiapkan. Belum ada browser QA ulang.
- Status migrasi dasar absensi perlu direkonsiliasi dengan `supabase migration list --remote`: migration rekap bulanan `20261128090000_student_attendance_monthly_summary.sql` sudah dikonfirmasi pengguna deployed, tetapi status remote migration dasar `20261127330000_student_daily_attendance.sql` belum tercatat ulang pada dokumen. Jangan menjalankan SQL/db push tanpa pemeriksaan history, backup, dan persetujuan eksplisit.

### Pembaruan browser QA undangan guru — 2026-11-28
- [x] Happy path: pengguna berhasil membuat undangan, menyelesaikan verifikasi OTP, dan masuk ke `/ruang-guru`.
- [ ] Edge-case browser: token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun existing-role, tautan duplikat, dan login ulang setelah logout.
- [ ] Verifikasi migrasi production `20261124360000_teacher_account_invitations.sql` tetap terpisah dan belum dilakukan.
- Prioritas QA berikutnya berpindah ke modul Absensi guru/admin/siswa, kemudian rekap bulanan dan ekspor CSV.

### Pembaruan PR #24 — 2026-11-28
- PR #24 dokumentasi status regression test undangan guru sudah merged; merge commit `9b880232c038fe96f4141cb5fdcbce9ba6f9e914`.
- Audit statis migrasi undangan guru telah dilakukan. Penerapan production belum diverifikasi dan tidak ada koneksi/perubahan database production.
- Prioritas QA berikutnya: alur undangan guru, lalu absensi guru/admin/siswa. Migrasi production tetap memerlukan pemeriksaan migration history, backup, dan persetujuan eksplisit.

### Pembaruan PR #23 — 2026-11-28
- Regression test guard undangan akun guru sudah merged melalui PR #23; fixture role existing-account diperbaiki agar benar-benar tersimpan sebelum pengujian authenticated.
- Item database regression test ditutup. Browser QA dan verifikasi migrasi production tetap tertunda; tidak ada perubahan database production.

### Pembaruan PR #29 — 2026-11-28
- PR #29 sudah merged ke `main` (merge commit `f45800aeff56e0ca512f9cabd7b506ea1090cad6`); pengguna mengonfirmasi CI #427 hijau.
- Regression test database mencakup siklus guru/admin: roster, draft parsial, submit lengkap, koreksi dan audit, lock/unlock, serta penolakan perubahan setelah submit/lock.
- Tidak ada migrasi baru atau perubahan Supabase production.
- Pekerjaan test berikutnya memperkuat rekap bulanan agar sesi draft terbukti tidak ikut dihitung; browser QA tetap terpisah.

### Pembaruan PR #30 — 2026-11-28
- PR #30 sudah merged ke `main` (merge commit `ca05bf06d12fb2199ec5885b982bc47deaac570f`); pengguna mengonfirmasi PR sukses.
- Rekap bulanan diuji agar sesi draft dan status di dalamnya tidak ikut dihitung.
- Lanjutan test: isolasi riwayat absensi siswa untuk sesi submitted/locked saja; browser QA riwayat Portal Siswa, rekap bulanan, dan ekspor CSV masih menunggu.

## 1. Lifecycle siswa dan kelas

- [x] Uji browser perubahan status siswa menjadi transferred dilaporkan berhasil.
- [ ] Uji alur withdrawn melalui UI dan verifikasi penutupan enrollment, pelepasan kapasitas, serta retensi histori.
- [x] Regression test database penempatan individual: INSERT/UPDATE ditolak tanpa permission `students:view` dan `classes:view`; PR #19 menambahkan guard RLS.
- [x] Browser QA penempatan individual melalui dashboard dan detail rombel; pengguna mengonfirmasi seluruh pengujian PR #28 berhasil.
- [x] Regression test database kenaikan kelas massal: rollback saat kapasitas tidak cukup, penolakan tanpa permission, tingkat tujuan salah, tahun ajaran salah, dan tahun asal tidak aktif; penempatan target tidak berubah pada percobaan yang ditolak.
- [ ] Browser QA kenaikan kelas massal melalui dashboard dengan data uji.
- [x] Regression test database kelulusan massal kelas XII: permission, kelas non-XII, tahun ajaran tidak aktif, tanggal null/tidak valid, rollback tanpa histori parsial, kelulusan sukses, dan penolakan pengulangan.
- [ ] Browser QA kelulusan kelas XII melalui dashboard, termasuk tanggal kelulusan dan riwayat status.
- [x] Regression test database arsip: penolakan untuk siswa dengan penempatan aktif, akun Portal Siswa tertaut, atau undangan aktif; arsip setelah penempatan ditutup tetap mempertahankan enrollment dan histori.
- [ ] Verifikasi migration `20261127320000_student_archive.sql` pada Supabase production (termasuk RPC dan trigger); lanjutkan browser QA arsip/pemulihan. Kolom `archived_at` pernah ditambahkan manual.

## 2. Modul Absensi Siswa

- [x] PR #12 sudah merged; CI #367 sukses pada head commit PR (lint, typecheck, unit test, build, database assertions, dan concurrency tests).
- [ ] Browser QA pencatatan guru: roster kelas wali yang benar, draft parsial, submit lengkap, dan pemilihan tanggal hari ini hingga 7 hari sebelumnya. Pengguna melaporkan roster kosong dan tanggal selalu kembali ke 28 November; perbaikan UI pemilih tanggal sedang dibuat pada PR #27.
- [x] Browser QA admin: tab Absensi tampil di dashboard dan rekap harian termuat (dikonfirmasi pengguna, 2026-11-28).
- [ ] Browser QA admin lanjutan: koreksi dengan alasan, lock dan unlock.
- [ ] Browser QA Portal Siswa: hanya riwayat siswa yang sedang login yang tampil.
- [ ] Rekonsiliasi migration list remote untuk `20261127330000_student_daily_attendance.sql` (jangan simpulkan belum diterapkan sebelum memeriksa history; migration rekap bulanan sudah dikonfirmasi deployed). Sebelum tindakan DB, review SQL, pastikan backup, dan minta persetujuan eksplisit.
- [x] Rekap bulanan per rombel, filter bulan, distribusi status, dan persentase hadir sudah merged melalui PR #16; pengguna mengonfirmasi migration `20261128090000_student_attendance_monthly_summary.sql` sudah dideploy.
- [ ] Browser QA rekap bulanan: ganti bulan, validasi angka per rombel, dan pastikan draft tidak masuk statistik.
- [x] Ekspor CSV rekap bulanan sudah merged melalui PR #17 (merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`); CI hijau dikonfirmasi pengguna.\n- [ ] Browser QA ekspor CSV: unduh dari dashboard, cocokkan isi dengan rekap bulan terpilih, dan buka file pada spreadsheet.
- [ ] Kalender libur dan absensi per mata pelajaran tetap opsi pengembangan berikutnya.

## 3. Undangan akun guru

- [x] Regression test database undangan guru: token dicabut/kedaluwarsa/telah dipakai, email belum diverifikasi, akun sudah memiliki role, dan profil yang sudah tertaut tidak dapat diundang ulang; PR #23 sudah merged dan CI hijau dikonfirmasi pengguna.
- [x] Browser QA happy-path: undangan berhasil dibuat, OTP diverifikasi, dan akun berhasil masuk ke `/ruang-guru` (dikonfirmasi pengguna, 2026-11-28).
- [ ] Browser QA edge-case: token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun yang sudah memiliki role, tautan duplikat, dan redirect role.
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
