# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Baca sebelum melanjutkan dan perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Branch:** `main`
- **Tahap:** Fase 5 — Admin CRUD dan publikasi konten; modul Berita sudah diimplementasikan dan pemeriksaan lokal dikonfirmasi lolos oleh pengguna.
- **Commit dokumentasi terbaru sebelum pembaruan ini:** `637d2e6` — penjelasan commit CMS dan status migrasi.
- **Commit perubahan kode terbaru:** `1972285` — sembunyikan tautan navigasi ke modul admin yang belum tersedia.
- **Status pemeriksaan:** pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah implementasi CMS Berita (2026-11-24).
- **Status Supabase:** pemeriksaan `pnpm dlx supabase migration list --remote` pada 2026-11-24 membuktikan lima migrasi fondasi awal sudah tercatat di remote, sedangkan enam migrasi konten (20261124100000–20261124150000) belum tercatat dan masih pending. Jangan menganggap tabel konten sudah tersedia sebelum migrasi pending diterapkan.
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
| `20261124100000_public_content_foundation.sql` | departments, teachers, news_categories, news, announcements | Pending — belum tercatat di remote |
| `20261124110000_default_teacher_unpublished.sql` | Default guru tidak langsung tampil | Pending — belum tercatat di remote |
| `20261124120000_public_galleries.sql` | galleries, gallery_images | Pending — belum tercatat di remote |
| `20261124130000_public_achievements.sql` | achievements + permission publish | Pending — belum tercatat di remote |
| `20261124140000_public_events.sql` | events + permission events:publish | Pending — belum tercatat di remote |
| `20261124150000_content_publication_guard.sql` | Penguatan RLS publish News, Announcements, dan Galleries | Pending — belum tercatat di remote |

Semua konten publik mengikuti status publikasi dan waktu tayang. Operasi tulis harus mengikuti permission RBAC masing-masing modul.

## Audit struktur proyek — 2026-11-24

- README dan progress diperiksa terhadap branch `main`, termasuk tree route, konfigurasi package, navigasi, query publik, dan migrasi.
- Struktur domain dan pemisahan route publik/admin sudah terbentuk dan konsisten.
- Temuan awal: navigasi admin mencantumkan banyak modul yang belum memiliki route. Setelah tahap CMS Berita, route admin yang tersedia adalah `/admin`, `/admin/identitas`, `/admin/profil`, `/admin/pengaturan`, dan `/admin/berita`. Menu yang belum memiliki route kini disembunyikan dari sidebar.
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

1. Lanjutkan CMS Pengumuman; pertahankan pola validasi, server permission, activity log, RLS, dan dokumentasi progress.
2. Terapkan migrasi Supabase secara berurutan dan konfirmasi hasilnya. Verifikasi RLS menggunakan sesi anon dan akun dengan permission berbeda.
3. Setelah CMS Berita lolos, implementasikan CMS Pengumuman, Galeri, Prestasi, Agenda, Guru, dan Jurusan secara bertahap.
4. Audit serta sinkronkan menu publik yang belum memiliki route (misalnya Siswa dan PPDB/SPMB) sebelum dianggap siap.
5. Lakukan build Cloudflare/OpenNext dan pengujian browser responsif serta aksesibilitas setelah rangkaian halaman publik dan admin stabil.

## Catatan yang belum diverifikasi

- Penerapan migrasi konten, Galeri, Prestasi, Agenda, dan penguatan RLS publikasi pada Supabase aktif.
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
- Status pengujian perubahan CMS ini: pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` semuanya lolos (2026-11-24). Asisten tidak menjalankan tes secara lokal.
- Status migrasi `20261124150000_content_publication_guard.sql`: belum dikonfirmasi diterapkan ke Supabase.
- Modul Berita dinyatakan lolos pemeriksaan oleh pengguna. Tahap selanjutnya: gunakan pola yang sama untuk Pengumuman, kemudian Galeri, Prestasi, Agenda, Guru, dan Jurusan. Jangan menambahkan menu admin baru sebelum route dan permission guard modul tersedia.


## Panduan penerapan migrasi Supabase (belum dijalankan/dikonfirmasi)

Pengguna belum pernah mengonfirmasi penerapan migrasi konten. Status semua migrasi di tabel di atas tetap **Belum dikonfirmasi**. Tes aplikasi yang lolos tidak membuktikan migrasi database sudah diterapkan.

### Jalur yang direkomendasikan: Supabase CLI

1. Pastikan proyek Supabase yang benar dipilih dan pengguna memiliki akses.
2. Dari root repository, login CLI: `pnpm dlx supabase login` (atau gunakan instalasi Supabase CLI yang sudah tersedia).
3. Hubungkan folder proyek ke project Supabase yang benar: `pnpm dlx supabase link --project-ref <PROJECT_REF>`. Project ref dapat dilihat di Dashboard Supabase → Project Settings → General. Jangan menaruh access token atau database password di Git.
4. Periksa riwayat migrasi pada proyek Supabase remote (bukan local stack): `pnpm dlx supabase migration list --remote`. Tanpa `--remote`, CLI mencoba menghubungi database lokal di `127.0.0.1:54322` dan dapat gagal bila Docker/local stack tidak berjalan.
5. Jika riwayat remote cocok dan belum ada migrasi tertunda yang tidak dikenal, jalankan `pnpm dlx supabase db push`.
6. Periksa output CLI. Jika ada perbedaan riwayat, migrasi yang sudah pernah dijalankan secara manual, atau error, **berhenti** dan audit dahulu; jangan menjalankan ulang SQL secara membabi buta dan jangan memakai `migration repair` tanpa memastikan keadaan database.
7. Setelah berhasil, jalankan kembali tes integrasi yang relevan dan konfirmasi tanggal, project ref (boleh disamarkan), serta daftar migrasi yang berhasil. Baru ubah status migrasi di dokumen ini menjadi diterapkan.

**Penting:** jangan menjalankan seluruh file SQL secara manual di SQL Editor jika nanti akan mengelola migrasi dengan CLI, karena eksekusi manual tidak otomatis mencatat versi tersebut pada tabel riwayat migrasi CLI. Jika migrasi sebelumnya memang sudah dijalankan manual, hentikan dulu sebelum `db push`; kita perlu menyelaraskan riwayat secara hati-hati.

### Urutan migrasi konten yang harus diperiksa

- `20261124100000_public_content_foundation.sql`
- `20261124110000_default_teacher_unpublished.sql`
- `20261124120000_public_galleries.sql`
- `20261124130000_public_achievements.sql`
- `20261124140000_public_events.sql`
- `20261124150000_content_publication_guard.sql`

Migrasi fondasi sebelumnya (RBAC, akses, storage/activity log, identitas sekolah) juga harus tercatat pada database target. Jangan menganggap daftar di atas sebagai keseluruhan migrasi proyek.


### Bukti pemeriksaan migrasi remote — 2026-11-24

Pengguna menjalankan `pnpm dlx supabase migration list --remote` pada proyek production `Web-Sekolah` (project ref `nofznzznzjsvnkrmzpwx`). Output menunjukkan:

- Lima migrasi fondasi tercatat sama pada Local dan Remote: `20261123091127`, `20261123100631`, `20261123101642`, `20261123133817`, `20261123134224`.
- Enam migrasi konten belum memiliki timestamp Remote: `20261124100000`, `20261124110000`, `20261124120000`, `20261124130000`, `20261124140000`, `20261124150000`.
- Kesimpulan: enam migrasi tersebut pending berdasarkan riwayat CLI remote. Belum ada bukti bahwa skema konten telah dibuat di production.
- CLI melewati `.gitkeep` karena bukan file migrasi SQL; ini aman diabaikan.
- Peringatan pnpm native binary dan pemberitahuan versi CLI lebih baru bukan penyebab kegagalan; perintah remote berhasil terhubung.
- Langkah berikutnya: sebelum `supabase db push`, tinjau keenam file SQL, pastikan target project benar dan lakukan backup database production. Setelah itu jalankan push secara sadar, tinjau output, lalu ulangi `pnpm dlx supabase migration list --remote` untuk memastikan semua versi tercatat.

### Review SQL migrasi pending — 2026-11-24

- Keenam file migrasi pending (`20261124100000` sampai `20261124150000`) dibaca dari branch `main`.
- Isi utama: membuat tabel konten dan akademik, indeks, trigger `updated_at`, grants, RLS policies, menambah permission publikasi, mengubah default `teachers.is_published`, dan memperketat policy publikasi.
- Tidak ditemukan perintah `drop table`, `truncate`, atau penghapusan massal data pada keenam file yang ditinjau.
- Migrasi `20261124150000` menggunakan `drop policy if exists` untuk mengganti policy RLS; ini menghapus policy bernama tersebut lalu membuat policy penggantinya, bukan menghapus tabel/data.
- Review isi SQL bukan pengganti backup atau verifikasi skema live. Sebelum push ke production, lakukan backup dan preview migrasi jika CLI mendukung `--dry-run`; jangan lanjut jika preview menampilkan versi yang tidak diharapkan.

### Dry-run penerapan migrasi production — 2026-11-24

- Pengguna menjalankan `pnpm dlx supabase db push --remote --dry-run` terhadap project production `nofznzznzjsvnkrmzpwx`.
- Dry-run berhasil dan menampilkan tepat enam migrasi pending yang diharapkan: `20261124100000_public_content_foundation.sql`, `20261124110000_default_teacher_unpublished.sql`, `20261124120000_public_galleries.sql`, `20261124130000_public_achievements.sql`, `20261124140000_public_events.sql`, `20261124150000_content_publication_guard.sql`.
- Output secara eksplisit menyatakan migrasi tidak didorong ke database. Jadi sampai bukti push aktual tersedia, keenam migrasi tetap berstatus pending/belum diterapkan.
- Langkah aman berikutnya: pastikan backup database production tersedia/selesai, kemudian pengguna dapat menyetujui dan menjalankan `pnpm dlx supabase db push --remote`; setelah itu periksa ulang `pnpm dlx supabase migration list --remote`.
