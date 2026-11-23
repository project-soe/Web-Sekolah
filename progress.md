# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Branch:** `main`
- **Tahap:** Fase 4 — pengembangan website publik dan fondasi konten.
- **Status terakhir yang diketahui:** perubahan telah di-commit ke GitHub. Penerapan migrasi terbaru ke Supabase dan verifikasi runtime belum dikonfirmasi.
- **Aturan kerja:** baca dokumen ini sebelum melanjutkan; jangan menyatakan build/typecheck/test/migrasi berhasil tanpa menjalankannya.

## Ringkasan arsitektur

- Next.js App Router + TypeScript + Tailwind CSS 4.
- Supabase PostgreSQL/Auth/Storage dengan RLS dan RBAC.
- Query publik memakai `createPublicClient()` (anon key), bukan service role.
- Fitur dikelompokkan di `src/features/`; route publik berada di `src/app/(public)/`.
- Migrasi database bersifat berurutan dan ditambahkan sebagai file baru.

## Pekerjaan selesai

### Fondasi dan keamanan
- Fondasi RBAC, role, permission, user profile, dan RLS tersedia melalui migrasi.
- Storage buckets dan activity log tersedia melalui migrasi.
- Identitas sekolah dan profil sekolah telah memiliki alur pengelolaan.
- Pengujian fase 3D sebelumnya dilaporkan lulus: 6 skenario lolos, 0 gagal (anon read profile; anon ditolak saat mengubah profil/identitas; editor ditolak mengubah profil; admin sekolah dapat mengubah profil; batas panjang visi divalidasi DB).
- Typecheck sebelumnya dilaporkan lulus setelah perbaikan nullable WhatsApp.

### Website publik
- Beranda dinamis membaca pengaturan dan profil sekolah.
- Nama kepala sekolah ditampilkan sebelum jenjang pendidikan pada sorotan informasi beranda.
- Halaman profil dan kontak telah dibuat/diperbarui.
- Metadata publik dan aturan robots telah ditambahkan.
- Navigasi sudah memuat rute Guru, Jurusan, Berita, Pengumuman, PPDB, Galeri, Prestasi, Agenda, dan Kontak; beberapa rute masih dalam antrean implementasi.

### Fondasi konten database
Migrasi `20261124100000_public_content_foundation.sql` menambahkan:
- `departments`
- `teachers`
- `news_categories`
- `news`
- `announcements`

RLS mengizinkan publik membaca konten yang dipublikasikan sesuai waktu tayang; operasi tulis membutuhkan permission RBAC. Departemen dan guru menggunakan flag `is_published`.

**Penting:** penerapan migrasi tersebut ke Supabase belum dikonfirmasi. Jangan menganggap tabel sudah tersedia di database aktif.

## Perubahan sesi terbaru

### 2026-11-24 — dokumentasi serah terima
- Mengganti README template Next.js dengan panduan proyek, teknologi, perintah, konfigurasi, prinsip keamanan, dan alur serah terima.
- Menambahkan dokumen progress ini agar status kerja dan langkah selanjutnya tercatat.

### 2026-11-24 — halaman publik Guru dan Jurusan
- Menambahkan query publik untuk daftar guru dan jurusan.
- Menambahkan halaman `/guru` dan `/jurusan` dengan filter publikasi, tampilan kosong, dan URL foto/media.
- Menambahkan migrasi lanjutan `20261124110000_default_teacher_unpublished.sql` untuk memastikan default `teachers.is_published` adalah `false`; migrasi lama tidak diubah.
- Commit dokumentasi README: `d91c290`.
- Commit progress awal: `f9c19ee`.
- Query publik: `b91180c`; halaman Guru: `d900580`; halaman Jurusan: `2596efd`; migrasi default publikasi: `baa74fe`.
- Merapikan kartu jurusan agar tidak menampilkan tautan generik yang mengarah ke halaman guru: `d00f30b`.
- Status pemeriksaan lokal belum dijalankan dalam sesi ini; minta pengembang menjalankan typecheck/lint/test setelah pull.

## Catatan migrasi dan operasional

1. Terapkan migrasi Supabase sesuai urutan timestamp.
2. Setelah migrasi diterapkan, verifikasi RLS menggunakan sesi anon dan akun dengan permission terkait.
3. Pastikan bucket `media` dan struktur folder penyimpanan sesuai migrasi storage.
4. Buat data guru/jurusan dari dashboard/admin setelah modul pengelolaannya tersedia; tandai `is_published = true` hanya setelah konten siap ditampilkan.
5. Jangan menampilkan nomor pegawai, email, atau data pribadi guru ke publik kecuali memang menjadi kebutuhan dan telah disetujui sekolah.

## Langkah berikutnya

1. Pull branch `main` dan jalankan `pnpm typecheck`, `pnpm lint`, serta `pnpm test`.
2. Terapkan migrasi konten publik dan migrasi default publikasi guru di Supabase.
3. Verifikasi query halaman `/guru` dan `/jurusan` dengan data draft dan data terpublikasi untuk memastikan RLS bekerja.
4. Implementasikan halaman daftar/detail Berita dan Pengumuman.
5. Lanjutkan Galeri, Prestasi, Agenda, lalu modul admin CRUD/publikasi untuk setiap konten.

## Catatan yang belum diverifikasi

- Status penerapan migrasi konten publik pada Supabase aktif.
- Hasil build Cloudflare/OpenNext setelah perubahan publik terbaru.
- Pengujian browser responsif dan aksesibilitas untuk halaman Guru/Jurusan.
