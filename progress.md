# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Baca sebelum melanjutkan dan perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Branch:** `main`
- **Tahap:** Fase 4 — halaman publik inti selesai sampai Agenda; berikutnya audit kesiapan database dan implementasi CRUD admin secara bertahap.
- **Commit fitur terbaru:** `272e96d` — halaman detail Agenda.
- **Status pemeriksaan:** pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah implementasi Prestasi. Pemeriksaan tersebut belum mencakup perubahan Agenda.
- **Status Supabase:** penerapan migrasi konten publik, Galeri, Prestasi, dan Agenda ke proyek Supabase aktif belum dikonfirmasi. Jangan menganggap tabel-tabel ini sudah tersedia.
- **Aturan kerja:** jangan menyatakan build/typecheck/test/migrasi berhasil tanpa hasil yang benar-benar terkonfirmasi.

## Ringkasan arsitektur

- Next.js App Router + TypeScript + Tailwind CSS 4.
- Supabase PostgreSQL/Auth/Storage dengan Row Level Security (RLS) dan Role-Based Access Control (RBAC).
- Query publik berada di `src/features/content/public-queries.ts` dan menggunakan `createPublicClient()` dengan anon key.
- Route website publik berada di `src/app/(public)/`; route administrasi berada di `src/app/admin/`.
- Fitur/domain berada di `src/features/`; integrasi Supabase, autentikasi, RBAC, dan storage berada di `src/lib/`.
- Migrasi database ditambahkan sebagai file baru dan diterapkan berurutan. Jangan mengubah migrasi lama yang mungkin sudah diterapkan.

## Pekerjaan selesai

### Fondasi dan keamanan
- Fondasi RBAC, role, permission, user profile, dan RLS tersedia melalui migrasi.
- Storage buckets dan activity log tersedia melalui migrasi.
- Identitas sekolah dan profil sekolah memiliki alur pengelolaan.
- Pengujian fase 3D sebelumnya dilaporkan lulus: 6 skenario lolos, 0 gagal.
- Prinsip keamanan: query publik menggunakan anon client; data tulis harus dilindungi RLS dan permission, bukan hanya disembunyikan di UI.

### Website publik
- Beranda dinamis, profil sekolah, kontak, metadata publik, dan robots.
- Halaman Guru dan Jurusan.
- Berita dan detail berita: `/berita`, `/berita/[slug]`.
- Pengumuman dan detail pengumuman: `/pengumuman`, `/pengumuman/[slug]`.
- Galeri dan detail album: `/galeri`, `/galeri/[slug]`.
- Prestasi dan detail: `/prestasi`, `/prestasi/[slug]`.
- Agenda mendatang/berlangsung dan detail: `/agenda`, `/agenda/[slug]`.
- Halaman daftar menyediakan empty state ketika belum ada konten publik.
- Agenda publik menampilkan kegiatan yang belum berakhir (akan datang atau sedang berlangsung), statusnya published, dan waktu publikasinya sudah tiba. Waktu detail ditampilkan dalam zona Asia/Jakarta.

### Fondasi konten database

| Migrasi | Isi | Status penerapan |
|---|---|---|
| `20261124100000_public_content_foundation.sql` | departments, teachers, news_categories, news, announcements | Belum dikonfirmasi |
| `20261124110000_default_teacher_unpublished.sql` | Default guru tidak langsung tampil | Belum dikonfirmasi |
| `20261124120000_public_galleries.sql` | galleries, gallery_images | Belum dikonfirmasi |
| `20261124130000_public_achievements.sql` | achievements + permission publish | Belum dikonfirmasi |
| `20261124140000_public_events.sql` | events + permission events:publish | Belum dikonfirmasi |

Semua konten publik mengikuti status publikasi dan waktu tayang. Operasi tulis harus mengikuti permission RBAC masing-masing modul.

## Audit struktur proyek — 2026-11-24

- README dan progress diperiksa terhadap branch `main`, termasuk tree route, konfigurasi package, navigasi, query publik, dan migrasi.
- Struktur domain dan pemisahan route publik/admin sudah terbentuk dan konsisten.
- Temuan penting: `src/config/navigation.ts` sudah mencantumkan banyak tautan `adminNav`, tetapi route admin yang benar-benar ada masih hanya `/admin`, `/admin/identitas`, `/admin/profil`, dan `/admin/pengaturan`. Tautan admin untuk Guru, Jurusan, Berita, Pengumuman, Galeri, Prestasi, Agenda, dan modul lain belum memiliki halaman tujuan. Jangan menganggap CRUD modul-modul tersebut sudah tersedia.
- `publicNav` mencantumkan Siswa dan PPDB/SPMB, sementara route publik untuk beberapa menu itu belum terlihat di tree saat audit.
- README sebelumnya belum menyebut migrasi Galeri, Prestasi, dan Agenda; ringkasan database sudah diperbarui.
- Catatan progress lama memuat langkah yang sudah kedaluwarsa dan baris literal `\\n`; dokumen ini menggantinya dengan status yang diselaraskan terhadap tree terbaru.

## Perubahan terbaru

### 2026-11-24 — Agenda Sekolah
- Menambahkan migrasi `20261124140000_public_events.sql` untuk tabel `events`, indeks publikasi, trigger `updated_at`, validasi waktu mulai/selesai, URL pendaftaran HTTPS, serta RLS publik/staf.
- Menambahkan permission `events:publish`; create/update/delete dan publikasi dilindungi permission RBAC.
- Menambahkan tipe `PublicEvent`, `getPublicEvents`, dan `getPublicEventBySlug` di `src/features/content/public-queries.ts`.
- Menambahkan `/agenda` untuk agenda mendatang dan `/agenda/[slug]` untuk detail kegiatan.
- Detail agenda memuat waktu, lokasi, gambar, deskripsi, dan tautan pendaftaran bila tersedia.
- Waktu detail diformat dengan zona `Asia/Jakarta`.
- Commit migrasi: `16b4e96`; query: `071ebcb`; filter agenda mendatang: `dc62218`; daftar publik: `066a739`; detail: `272e96d`; format zona waktu: `3475d54`.
- README diperbarui pada commit `1048ba7`.
- Pengujian typecheck/lint/test setelah perubahan Agenda belum dijalankan atau dikonfirmasi. Migrasi Agenda belum dikonfirmasi diterapkan ke Supabase.

### 2026-11-24 — Prestasi Sekolah
- Menambahkan migrasi `20261124130000_public_achievements.sql` untuk tabel `achievements`, indeks, trigger, validasi tingkat/status/tanggal, serta RLS.
- Menambahkan permission `achievements:publish`; operasi tulis mengikuti permission RBAC.
- Menambahkan query publik daftar dan detail prestasi.
- Menambahkan `/prestasi` dan `/prestasi/[slug]`.
- Commit migrasi: `8caa738`; query: `c409ca0`; daftar: `d379a61`; detail: `79f8fef`.
- Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah tahap ini.

### 2026-11-24 — Perbaikan query Galeri
- Menghapus blok import duplikat `server-only`, `cache`, dan `createPublicClient` pada `src/features/content/public-queries.ts`.
- Commit perbaikan: `952f32e`; catatan dokumentasi sebelumnya: `42c6789`.

### 2026-11-24 — Galeri Sekolah
- Menambahkan migrasi `20261124120000_public_galleries.sql` untuk `galleries` dan `gallery_images`, termasuk RLS dan permission.
- Menambahkan query publik album dan detail album.
- Menambahkan `/galeri` dan `/galeri/[slug]`.
- Commit migrasi: `260909f`; query: `a287b3f`; daftar: `cd89db6`; detail: `aa70729`; catatan progress: `ff91217`.

### 2026-11-24 — Berita dan Pengumuman
- Menambahkan query publik dan halaman daftar/detail berita serta pengumuman.
- Commit query: `648f858`; berita: `dd92fdf`, `776e8bb`; pengumuman: `673f491`, `eab72bb`.

### 2026-11-24 — Guru dan Jurusan
- Menambahkan query publik dan halaman `/guru`, `/jurusan`.
- Menambahkan migrasi default guru tidak dipublikasikan.
- Commit query: `b91180c`; Guru: `d900580`; Jurusan: `2596efd`; migrasi default: `baa74fe`; perapian kartu: `d00f30b`.

## Temuan dan tindak lanjut

1. Jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test` setelah perubahan Agenda.
2. Terapkan migrasi Supabase secara berurutan dan konfirmasi hasilnya. Verifikasi RLS menggunakan sesi anon dan akun dengan permission berbeda.
3. Prioritaskan modul admin CRUD dan publikasi. Sebelum menambah tautan baru, pastikan route admin benar-benar dibuat dan dilindungi permission.
4. Audit serta sinkronkan menu publik yang belum memiliki route (misalnya Siswa dan PPDB/SPMB) sebelum dianggap siap.
5. Lakukan build Cloudflare/OpenNext dan pengujian browser responsif serta aksesibilitas setelah rangkaian halaman publik stabil.

## Catatan yang belum diverifikasi

- Penerapan migrasi konten, Galeri, Prestasi, dan Agenda pada Supabase aktif.
- Typecheck/lint/test setelah perubahan Agenda.
- Build Cloudflare/OpenNext.
- Pengujian browser untuk responsivitas, aksesibilitas, dan perilaku seluruh tautan navigasi.
- Ketersediaan data konten produksi dan validasi alur publikasi dari panel admin.


## 2026-11-24 — Tahap Admin CRUD dan Publikasi (modul pertama: Berita)

- Pengguna mengonfirmasi seluruh pemeriksaan Agenda sebelumnya lolos.
- Audit menemukan halaman admin yang tersedia masih terbatas dan sebagian besar tautan navigasi admin belum memiliki route.
- Audit keamanan menemukan kebijakan RLS News dan Announcements lama belum mensyaratkan permission `:publish` saat status diubah menjadi `published`; kebijakan insert Galeri juga belum mensyaratkan permission publikasi.
- Menambahkan migrasi `20261124150000_content_publication_guard.sql` untuk memperketat RLS News, Announcements, dan Galeri. Commit: `6acb18a`.
- Menambahkan validasi berita (Zod), server actions create/update/delete, pemeriksaan permission pada server, pencatatan activity log, dan revalidasi route. Commit schema: `ff25c16`; actions: `881dcfe`.
- Menambahkan editor berita dengan dukungan draft, publish, arsip, serta penjadwalan waktu Asia/Jakarta. Commit: `27fc102`.
- Menambahkan halaman daftar berita, tambah berita, edit berita, dan kontrol hapus dengan konfirmasi. Commit: `aa335c4`, `0204365`, `4a6cf5d`, `1a2f6ff`.
- Menambahkan penyaringan navigasi admin berdasarkan permission dan menyembunyikan modul yang belum memiliki route admin aktif agar tidak ada tautan mati. Commit: `2e99797`, `98e38ce`, `2dd1b04`, `884ecac`, `1972285`.
- Menambahkan unit test validasi schema berita. Commit: `ebfe419`.
- Perbaikan import tak terpakai pada halaman daftar berita: `d13e3d9`.
- Status pengujian perubahan CMS ini: belum dijalankan oleh asisten dan belum dikonfirmasi pengguna. Perlu jalankan typecheck, lint, test.
- Status migrasi `20261124150000_content_publication_guard.sql`: belum dikonfirmasi diterapkan ke Supabase.
- Tahap selanjutnya setelah modul Berita lolos: gunakan pola yang sama untuk Pengumuman, kemudian Galeri, Prestasi, Agenda, Guru, dan Jurusan. Jangan menambahkan menu admin baru sebelum route dan permission guard modul tersedia.
