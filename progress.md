# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Branch:** `main`
- **Tahap:** Fase 4 — pengembangan website publik dan fondasi konten (Galeri dan Prestasi selesai diimplementasikan; verifikasi lokal serta penerapan migrasi masih perlu dikonfirmasi).
- **Status terakhir yang diketahui:** halaman publik Guru, Jurusan, Berita, Pengumuman, Galeri, dan Prestasi sudah di-commit. Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah perbaikan import Galeri. Penerapan migrasi konten ke Supabase belum dikonfirmasi.
- **Pemeriksaan sebelumnya:** pengguna melaporkan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` tidak memiliki masalah setelah tahap Guru/Jurusan. Pemeriksaan itu mendahului perubahan Berita/Pengumuman.
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
- Halaman `/guru` dan `/jurusan` mengambil data yang telah dipublikasikan.
- Halaman `/berita` dan `/pengumuman` menampilkan konten publik, dengan halaman detail berbasis slug.
- Halaman `/galeri` menampilkan album publik dan jumlah foto; `/galeri/[slug]` menampilkan foto album beserta caption dan teks alternatif.\n- Halaman `/prestasi` menampilkan daftar pencapaian yang dipublikasikan; `/prestasi/[slug]` menampilkan detail, tingkat prestasi, penerima, tanggal, dan gambar.
- Detail berita menampilkan tanggal, kategori, gambar sampul, ringkasan, dan isi.
- Detail pengumuman menampilkan masa berlaku dan tautan lampiran PDF bila tersedia.
- Halaman daftar menampilkan empty state jika belum ada konten publik.

### Fondasi konten database
Migrasi `20261124100000_public_content_foundation.sql` menambahkan:
- `departments`
- `teachers`
- `news_categories`
- `news`
- `announcements`

RLS mengizinkan publik membaca konten yang dipublikasikan sesuai waktu tayang; pengumuman kedaluwarsa tidak ditampilkan. Operasi tulis membutuhkan permission RBAC. Departemen dan guru menggunakan flag `is_published`.

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
- Query publik awal: `b91180c`; halaman Guru: `d900580`; halaman Jurusan: `2596efd`; migrasi default publikasi: `baa74fe`.
- Perapian kartu jurusan: `d00f30b`.

### 2026-11-24 — halaman publik Berita dan Pengumuman
- Memperluas `src/features/content/public-queries.ts` dengan query daftar dan detail berita/pengumuman.
- Query hanya mengambil status `published`, tanggal publikasi yang sudah tiba, dan pengumuman yang belum kedaluwarsa.
- Menambahkan `/berita` dan `/berita/[slug]`.
- Menambahkan `/pengumuman` dan `/pengumuman/[slug]`.
- Berita menggunakan bucket `media`; lampiran pengumuman memakai bucket publik `public-docs`.
- Tidak menambahkan migrasi baru karena struktur tabel dan RLS sudah disiapkan pada migrasi fondasi konten.
- Commit query: `648f858`; daftar berita: `dd92fdf`; detail berita: `776e8bb`; daftar pengumuman: `673f491`; detail pengumuman: `eab72bb`.
- Pemeriksaan lokal untuk perubahan Berita/Pengumuman belum dijalankan dalam sesi ini.

### 2026-11-24 — Galeri sekolah
- Menambahkan migrasi baru `20261124120000_public_galleries.sql` untuk tabel `galleries` dan `gallery_images`; migrasi lama tidak diubah.
- Menambahkan indeks, trigger `updated_at`, validasi status/tanggal publikasi, serta RLS terpisah untuk anon dan authenticated.
- Pembacaan publik hanya mengizinkan album berstatus `published` dengan `published_at <= now()`; staf dapat membaca draft sesuai permission `galleries:view`.
- Perubahan album menggunakan permission `galleries:create/update/delete`; publikasi memerlukan `galleries:publish`. Pengelolaan foto menggunakan permission galeri yang sesuai.
- File foto menggunakan bucket publik `media`, folder `galleries/` (folder tersebut sudah termasuk allowlist policy storage).
- Menambahkan query `getPublicGalleries` dan `getPublicGalleryBySlug` pada `src/features/content/public-queries.ts`.
- Menambahkan halaman daftar `/galeri` dan detail album `/galeri/[slug]`, termasuk empty state, cover fallback dari foto pertama, metadata, caption, dan alt text.
- Commit migrasi: `260909f`; query: `a287b3f`; daftar galeri: `cd89db6`; detail album: `aa70729`.
- Perubahan ini belum diuji lokal oleh asisten dan migrasi belum dikonfirmasi diterapkan ke Supabase.

## Catatan migrasi dan operasional

1. Terapkan migrasi Supabase sesuai urutan timestamp.
2. Setelah migrasi diterapkan, verifikasi RLS menggunakan sesi anon dan akun dengan permission terkait.
3. Pastikan bucket `media` dan `public-docs` sesuai migrasi storage.
4. Buat data guru/jurusan/berita/pengumuman dari modul admin setelah modul pengelolaannya tersedia.
5. Publikasikan berita/pengumuman hanya setelah konten siap. Isikan `published_at`; untuk pengumuman, `expires_at` opsional tetapi harus lebih besar dari `published_at`.
6. Konten artikel saat ini ditampilkan sebagai teks biasa dengan pemisah baris; jangan menyimpan HTML yang diharapkan dieksekusi.

## Langkah berikutnya

1. Pull branch `main`, lalu jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` untuk memeriksa implementasi Berita/Pengumuman.
2. Verifikasi halaman `/berita`, `/berita/[slug]`, `/pengumuman`, dan `/pengumuman/[slug]` dengan data draft, published, jadwal masa depan, dan pengumuman kedaluwarsa.
3. Konfirmasi migrasi konten publik telah diterapkan di Supabase.
4. Pull branch `main`, lalu jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` untuk perubahan Galeri.
5. Terapkan migrasi `20261124120000_public_galleries.sql` ke Supabase dan verifikasi akses anon/staf.
6. Implementasikan Prestasi, lalu Agenda.
7. Lanjutkan modul admin CRUD dan publikasi konten.

## Catatan yang belum diverifikasi

- Status penerapan migrasi konten publik, Galeri, dan Prestasi pada Supabase aktif.
- Hasil typecheck/lint/test setelah perubahan Prestasi (pengguna sudah mengonfirmasi lulus untuk pemeriksaan setelah perbaikan Galeri, sebelum implementasi Prestasi).
- Hasil build Cloudflare/OpenNext.
- Pengujian browser responsif, aksesibilitas, dan tautan lampiran PDF.

### Perbaikan setelah implementasi Galeri — 2026-11-24
- Memperbaiki error TypeScript pada `src/features/content/public-queries.ts`: blok import `server-only`, `cache`, dan `createPublicClient` yang tidak sengaja terduplikasi saat penambahan query Galeri telah dihapus; import utama di bagian atas tetap digunakan.
- Commit perbaikan: `952f32e` (`fix(content): remove duplicate gallery imports`).
- Typecheck/lint/test setelah perbaikan ini belum dijalankan; minta pengembang menjalankan ulang ketiganya.


### 2026-11-24 — Prestasi Sekolah
- Pengguna mengonfirmasi pemeriksaan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah perbaikan import Galeri (konfirmasi pengguna; bukan hasil eksekusi asisten).
- Menambahkan migrasi `20261124130000_public_achievements.sql` untuk tabel `achievements`, indeks, trigger `updated_at`, validasi tingkat/status/tanggal publikasi, serta RLS anon dan staf.
- Menambahkan permission `achievements:publish`; pembuatan/perubahan/penghapusan mengikuti permission RBAC `achievements:create/update/delete`, dan publikasi memerlukan `achievements:publish`.
- Kolom konten: judul, slug, deskripsi, penerima, tingkat prestasi (Sekolah/Kabupaten-Kota/Provinsi/Nasional/Internasional), tanggal, gambar, status, waktu publikasi, dan urutan.
- Media prestasi memakai bucket publik `media` dengan folder `achievements/` yang sudah diizinkan oleh policy storage sebelumnya.
- Menambahkan `getPublicAchievements` dan `getPublicAchievementBySlug` pada `src/features/content/public-queries.ts`.
- Menambahkan halaman daftar `/prestasi` dan detail `/prestasi/[slug]`, termasuk metadata, empty state, dan fallback gambar.
- Commit migrasi: `8caa738`; query: `c409ca0`; daftar: `d379a61`; detail: `79f8fef`.
- Hasil pemeriksaan kode setelah implementasi Prestasi belum dikonfirmasi. Migrasi baru belum dikonfirmasi diterapkan ke Supabase.

