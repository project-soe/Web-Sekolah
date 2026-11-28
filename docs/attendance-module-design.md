# Modul Absensi Siswa

**Status:** implementasi tahap pertama pada PR #12 (feat/student-attendance-daily).
**Tanggal keputusan:** 2026-11-27.

## Keputusan domain yang disetujui

- Satu sesi absensi harian per rombongan belajar per tanggal.
- Guru wali kelas yang ditetapkan pada class_groups.homeroom_teacher_id menjadi pencatat.
- Input guru dibatasi hari ini sampai 7 hari kalender ke belakang (zona sekolah Asia/Jakarta).
- Status: present (hadir), late (terlambat), sick (sakit), excused (izin), absent (alpa).
- Draft boleh belum lengkap; submit ditolak sampai seluruh siswa aktif di roster memiliki status.
- Setelah submit, guru tidak dapat mengubah. Koreksi dilakukan admin dengan alasan wajib dan audit trail.
- Admin dapat mengunci sesi submitted; membuka kunci wajib alasan dan dicatat pada histori.
- Portal Siswa hanya menampilkan sesi submitted/locked untuk siswa yang sedang login.
- Draft dan hari tanpa sesi tidak masuk hitungan statistik resmi.

## Model data

- attendance_sessions: satu sesi per class_group_id + attendance_date, status draft/submitted/locked, metadata submit dan lock.
- attendance_entries: satu status per session_id + student_id, terikat pada enrollment yang aktif.
- attendance_entry_history: audit koreksi berisi nilai sebelum/sesudah, alasan, pelaku, dan waktu.

## Keamanan

- Tidak ada akses tabel langsung untuk anon/authenticated. Mutasi dan pembacaan roster dilakukan melalui RPC SECURITY DEFINER dengan search_path kosong.
- Guru diverifikasi melalui relasi teacher_user_links ke class_groups.homeroom_teacher_id.
- Admin menggunakan permission attendance:view_all, attendance:correct, dan attendance:lock.
- Siswa membaca melalui my_student_attendance(), yang mengikat hasil ke student_portal_accounts.user_id = auth.uid().
- Semua validasi penting berada di database; UI bukan batas keamanan.

## Route tahap pertama

- Guru: /ruang-guru — roster kelas wali, simpan draft, submit.
- Admin: /admin/absensi — rekap harian per tanggal, koreksi beralasan, lock/unlock.
- Siswa: bagian Riwayat Kehadiran pada /portal.

## Batas tahap pertama dan tindak lanjut

- Belum ada absensi per mata pelajaran, jadwal pelajaran, GPS/biometrik, notifikasi orang tua, kalender libur, atau ekspor.
- Rekap harian tetap tersedia. Rekap bulanan per rombel sedang diimplementasikan pada branch `feat/attendance-monthly-summary` melalui RPC admin yang hanya menghitung sesi `submitted`/`locked`.
- Definisi persentase pada tahap ini: `(Hadir + Terlambat) / seluruh status tercatat × 100`; status draft dikecualikan. Filter bulan tersedia pada rekap admin; ekspor laporan belum termasuk tahap ini.
- Perlu browser QA dengan akun guru yang benar-benar terhubung ke wali kelas, admin, dan siswa.
- Migrasi 20261127330000_student_daily_attendance.sql belum diterapkan ke Supabase production. Periksa seluruh migration list remote dan tinjau SQL sebelum deployment.
- Database CI harus lulus sebelum merge. Jangan menjalankan migrasi production dari PR branch sebelum merge dan persetujuan deployment.


## Rekap bulanan admin — 2026-11-28
- RPC `admin_attendance_monthly_summary(p_month date)` memerlukan permission `attendance:view_all` dan parameter tanggal harus hari pertama bulan.
- Hanya sesi berstatus `submitted` atau `locked` dihitung. Draft dan hari tanpa sesi tidak menjadi denominator.
- Hasil per rombel mencakup jumlah sesi, jumlah catatan siswa-hari, hitungan Hadir/Terlambat/Sakit/Izin/Alpa, dan persentase hadir.
- Persentase dihitung sebagai `(present + late) / seluruh entri status tercatat × 100`, dibulatkan dua desimal. Terlambat dihitung sebagai hadir.
- Implementasi berada pada branch `feat/attendance-monthly-summary`; migration belum diterapkan pada Supabase production sampai pemeriksaan riwayat dan persetujuan deployment.
