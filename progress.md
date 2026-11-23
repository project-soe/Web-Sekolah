# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Branch:** `main`
- **Tahap:** Fase 4 — pengembangan website publik dan fondasi konten.
- **Status terakhir yang diketahui:** implementasi halaman publik Guru, Jurusan, Berita, dan Pengumuman sudah di-commit. Migrasi konten terbaru ke Supabase dan pemeriksaan untuk commit terbaru belum dikonfirmasi.
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
4. Implementasikan Galeri dan Prestasi.
5. Lanjutkan Agenda, lalu modul admin CRUD dan publikasi konten.

## Catatan yang belum diverifikasi

- Status penerapan migrasi konten publik pada Supabase aktif.
- Hasil typecheck/lint/test setelah perubahan Berita/Pengumuman.
- Hasil build Cloudflare/OpenNext.
- Pengujian browser responsif, aksesibilitas, dan tautan lampiran PDF.
