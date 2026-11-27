# Rancangan Modul Absensi Siswa

> Dokumen desain domain sebelum migrasi dan implementasi. Rancangan ini mengikuti struktur akademik yang sudah ada: tahun ajaran, rombongan belajar, penempatan siswa, profil guru, dan tautan akun guru.

**Tanggal:** 2026-11-27  
**Status:** rancangan awal; belum ada perubahan skema atau aplikasi absensi.

## 1. Tujuan dan batas cakupan

Modul tahap pertama mencatat **kehadiran harian per rombongan belajar**, bukan absensi per mata pelajaran. Struktur proyek saat ini belum memiliki jadwal pelajaran/relasi guru pengampu mata pelajaran, sehingga absensi per jam pelajaran akan membutuhkan domain jadwal tersendiri.

Cakupan tahap pertama:

- Guru yang ditetapkan sebagai wali kelas dapat membuka daftar siswa kelasnya dan mengisi absensi harian.
- Guru dapat menyimpan sebagai draft dan mengirim/menyelesaikan absensi harian.
- Admin berwenang melihat rekap, mengoreksi data dengan alasan, dan mengunci/membuka kembali catatan sesuai permission.
- Siswa hanya dapat melihat riwayat kehadiran miliknya sendiri dari Portal Siswa; tidak dapat mengubah data.
- Riwayat koreksi dipertahankan sebagai audit trail.

Di luar cakupan tahap pertama: absensi per mata pelajaran, jadwal mengajar, presensi biometrik/GPS, integrasi perangkat, notifikasi otomatis orang tua, dan pengelolaan kalender libur.

## 2. Entitas dan relasi yang disarankan

### Sesi absensi harian

Satu sesi mewakili satu tanggal dan satu rombongan belajar.

Kolom konseptual:

- ID.
- `academic_year_id` dan `class_group_id`.
- `attendance_date` bertipe `date` (tanggal sekolah, bukan timestamp).
- Status workflow: `draft`, `submitted`, atau `locked`.
- Metadata pembuat, pengirim, pengunci, dan timestamp masing-masing.
- Catatan umum sesi opsional.

Kendala unik: satu sesi per `class_group_id + attendance_date`. Tanggal disimpan sebagai tanggal kalender sekolah; UI menampilkan tanggal sesuai zona sekolah Asia/Jakarta. Tidak ada sesi ganda untuk kelas dan hari yang sama.

### Entri kehadiran siswa

Satu entri untuk satu siswa dalam satu sesi.

Kolom konseptual:

- ID sesi.
- `student_id`.
- `enrollment_id` yang menunjuk penempatan siswa pada tahun ajaran tersebut.
- Status: `present`, `late`, `sick`, `excused`, atau `absent`.
- Waktu pencatatan dan pencatat.
- Catatan per siswa opsional.

Kendala unik: satu entri per `session_id + student_id`. Entri harus merujuk penempatan siswa yang benar pada rombel dan tahun ajaran sesi. Roster diambil dari penempatan kelas yang berlaku, bukan dari seluruh data induk siswa.

### Riwayat perubahan

Setiap perubahan status/catatan setelah entri dibuat dicatat dalam tabel histori terpisah: nilai sebelum, nilai sesudah, pelaku, waktu, dan alasan. Histori tidak dapat diubah atau dihapus oleh role aplikasi. Koreksi dilakukan melalui RPC transaksional, bukan update langsung dari browser.

## 3. Status kehadiran

| Status | Makna | Masuk hitungan hadir |
|---|---|---:|
| `present` | Hadir tepat waktu | Ya |
| `late` | Hadir terlambat | Ya |
| `sick` | Tidak hadir karena sakit | Tidak |
| `excused` | Tidak hadir dengan izin/keterangan | Tidak |
| `absent` | Tidak hadir tanpa keterangan | Tidak |

Status harus diisi eksplisit untuk setiap siswa saat sesi dikirim. Draft boleh belum lengkap. Sistem tidak boleh otomatis mengubah siswa yang belum diisi menjadi `absent` tanpa konfirmasi; UI harus menunjukkan jumlah entri yang belum ditentukan.

Persentase kehadiran dihitung sebagai `(present + late) / total hari efektif yang sudah memiliki sesi final`. Hari tanpa sesi tidak masuk penyebut. Periode tanpa sesi final ditampilkan sebagai belum tersedia, bukan 0%.

## 4. Matriks hak akses awal

Permission yang disarankan (harus didaftarkan melalui migrasi RBAC):

| Permission | Guru wali kelas | Admin sekolah | Siswa |
|---|---:|---:|---:|
| `attendance:view_own_class` | Kelas yang ditugaskan | Semua kelas | — |
| `attendance:take` | Kelas yang ditugaskan | Opsional sesuai kebijakan | — |
| `attendance:submit` | Kelas yang ditugaskan | Ya | — |
| `attendance:view_all` | — | Ya | — |
| `attendance:correct` | — | Ya | — |
| `attendance:lock` | — | Ya | — |
| Lihat absensi sendiri | — | — | Hanya siswa tertaut |

Pemeriksaan tidak cukup hanya berdasarkan permission. Server/RPC harus memastikan guru terhubung melalui `teacher_user_links` ke `class_groups.homeroom_teacher_id` untuk kelas terkait. Admin harus memiliki permission global yang sesuai. Siswa harus memiliki `student_portal_accounts` yang cocok dengan identitasnya dan hanya menerima data dirinya.

Tidak ada akses publik/anon. RLS tetap aktif pada semua tabel. Mutasi sensitif dilakukan lewat RPC `SECURITY DEFINER` dengan `search_path` aman dan pemeriksaan permission + relasi kelas di dalam transaksi.

## 5. Alur kerja

1. Guru membuka kelas wali yang ditugaskan dan memilih tanggal.
2. Sistem membuat atau mengambil satu sesi untuk kelas/tanggal itu.
3. Roster diambil dari `student_class_enrollments` pada tahun ajaran terkait; siswa nonaktif/arsip tidak dimasukkan.
4. Guru mengisi status setiap siswa dan menyimpan draft kapan saja.
5. Sebelum submit, UI menampilkan ringkasan status dan jumlah siswa yang belum diisi. Submit ditolak jika masih ada entri kosong.
6. Setelah submit, sesi menjadi final untuk input guru. Guru tidak dapat mengubah data yang sudah dikirim.
7. Admin dapat mengoreksi dengan alasan wajib. Setiap perubahan menulis histori.
8. Admin dapat mengunci sesi. Sesi terkunci tidak dapat diubah kecuali admin membuka kembali dengan alasan dan audit event.
9. Portal Siswa menampilkan tanggal, status, dan ringkasan milik siswa yang login saja.

## 6. Aturan tanggal dan perpindahan kelas

- Tanggal absensi adalah tipe `date`; jangan mengubahnya berdasarkan timezone browser.
- Sesi untuk tanggal masa depan ditolak.
- Rekomendasi awal: guru boleh membuat/mengubah draft untuk hari ini dan maksimal 7 hari kalender ke belakang. Koreksi di luar jendela tersebut hanya oleh admin dengan alasan. Angka 7 hari adalah usulan kebijakan, belum dianggap final.
- Roster harus konsisten dengan enrollment siswa. Entri menyimpan referensi enrollment agar histori tetap menunjuk rombel yang digunakan saat absensi dicatat.
- Perpindahan kelas tidak memindahkan atau menulis ulang sesi lama. Sesi lama tetap terkait kelas dan enrollment asal.
- Jika penempatan kelas diperbaiki secara retroaktif, admin harus menggunakan proses koreksi yang tercatat; jangan otomatis mengubah absensi lama.
- Hari libur/akhir pekan belum divalidasi otomatis karena kalender akademik belum tersedia.

## 7. Rekap dan tampilan

Tahap pertama menyediakan:

- Daftar sesi per kelas dan rentang tanggal.
- Rekap harian per kelas: jumlah present, late, sick, excused, absent, dan belum diisi.
- Rekap bulanan per siswa dengan persentase berdasarkan sesi final.
- Filter tahun ajaran, jurusan, rombel, dan rentang tanggal bagi admin.
- Tampilan Portal Siswa yang hanya memuat data siswa yang sedang login.

Rekap harus dihitung dari sesi final/terkunci sesuai kebijakan yang disepakati; draft tidak boleh ikut statistik resmi. Sesi kosong atau hari tanpa sesi tidak boleh dianggap alpa.

## 8. Keamanan, integritas, dan pengujian

Database tests wajib mencakup:

- Penolakan akses anon.
- Guru tidak dapat membaca atau mengubah kelas wali lain.
- Guru yang tidak ditugaskan tidak dapat membuat sesi untuk kelas tersebut.
- Siswa hanya dapat membaca absensi dirinya sendiri.
- Dua request bersamaan tidak dapat membuat sesi ganda.
- Dua request bersamaan tidak dapat membuat entri ganda.
- Submit ditolak jika ada siswa tanpa status.
- Mutasi sesi terkunci ditolak.
- Koreksi admin wajib menyertakan alasan dan menghasilkan histori yang tidak dapat dihapus.
- Roster/enrollment yang tidak cocok ditolak.
- Sesi masa depan dan guru di luar jendela tanggal ditolak.
- Perubahan kelas tidak mengubah histori sesi lama.
- Persentase rekap mengabaikan draft dan hari tanpa sesi.

## 9. Keputusan yang perlu dikunci sebelum migrasi

Rancangan ini merekomendasikan absensi harian wali kelas. Sebelum implementasi database, pemilik sekolah perlu mengonfirmasi:

1. Apakah satu absensi harian per rombel sudah sesuai, atau sekolah membutuhkan beberapa sesi (misalnya pagi dan siang)?
2. Apakah guru hanya wali kelas yang boleh mencatat pada tahap pertama?
3. Apakah jendela input mundur 7 hari kalender dapat diterapkan?
4. Apakah status dan rumus rekap pada dokumen ini sesuai kebijakan sekolah?
5. Apakah sesi yang sudah disubmit harus selalu dikoreksi admin, atau wali kelas boleh memperbaiki sampai admin mengunci?

Sampai keputusan tersebut dikunci, jangan membuat migrasi production. Setelah disepakati, urutan implementasi: migrasi + permission/RLS/RPC, database assertions, query/server actions, UI guru, UI admin/rekap, integrasi Portal Siswa, lalu browser QA.
