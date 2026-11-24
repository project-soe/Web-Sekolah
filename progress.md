# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Baca sebelum melanjutkan dan perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Tahap terbaru (2026-11-24):** build Cloudflare/OpenNext (`pnpm cf:build`) telah dikonfirmasi berhasil oleh pengguna dan artefak `.open-next/` tersedia. Audit RLS/Storage production, smoke test anon, serta pengujian editor dan permission Storage lintas-folder telah dilakukan/dilaporkan selesai. Langkah berikutnya: jalankan preview Worker (`pnpm exec wrangler dev`), lalu browser QA responsif dan aksesibilitas sebelum deployment.

- **Branch:** `main`
- **Tahap:** Fase 5 — Admin CRUD dan publikasi konten untuk modul Berita, Pengumuman, Galeri, Prestasi, Agenda, Guru, Jurusan, dan Fasilitas; audit RLS/Storage sedang menuju verifikasi akhir.
- **Commit dokumentasi terbaru:** `345f5b9f4ae782c5eae5638e4fb84c3dbb3d36bc` — konfirmasi build Cloudflare/OpenNext berhasil dan langkah preview Worker.
- **Commit perubahan kode terbaru yang tercatat dalam audit ini:** migration hardening RLS/Storage `80552300ae9e55b075f8fd0908a66a7a519ac959`; periksa riwayat `main` untuk commit kode yang lebih baru sebelum mengubah implementasi.
- **Status pemeriksaan:** pengguna telah mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos pada beberapa tahap CMS hingga Fasilitas. Pengguna kini juga mengonfirmasi `pnpm cf:build` selesai tanpa error; hasil preview Worker dan browser QA belum tersedia.
- **Status Supabase:** migration konten hingga Fasilitas telah dikonfirmasi diterapkan sebelumnya; migration hardening `20261124240000_security_rls_storage_hardening.sql` juga dikonfirmasi tercatat Local/Remote sama pada production. Lihat bagian audit keamanan di bawah untuk batas bukti dan detail verifikasi.
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
| `20261124100000_public_content_foundation.sql` | departments, teachers, news_categories, news, announcements | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124110000_default_teacher_unpublished.sql` | Default guru tidak langsung tampil | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124120000_public_galleries.sql` | galleries, gallery_images | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124130000_public_achievements.sql` | achievements + permission publish | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124140000_public_events.sql` | events + permission events:publish | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124150000_content_publication_guard.sql` | Penguatan RLS publish News, Announcements, dan Galleries | Diterapkan — dikonfirmasi pengguna 2026-11-24 |
| `20261124160000_announcement_publish_permission.sql` | Mendaftarkan permission `announcements:publish` yang dipakai policy RLS | Pending — belum diterapkan |

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

### Keputusan backup database — 2026-11-24

- Pengguna memilih tetap menggunakan paket Supabase gratis dan tidak melakukan upgrade berbayar hanya untuk fitur backup Dashboard.
- Backup otomatis/point-in-time dari Dashboard tidak tersedia pada paket saat ini; karena itu belum ada backup production yang terkonfirmasi.
- Keenam migrasi konten sudah ditinjau dan dry-run hanya menampilkan enam file yang diharapkan. Tidak ditemukan `drop table`, `truncate`, atau penghapusan massal data, tetapi ini tidak menghilangkan risiko kegagalan SQL atau perubahan policy.
- **Jangan menyebut database sudah dibackup dan jangan menganggap migrasi sudah diterapkan.** Status keenam migrasi tetap pending.
- Opsi backup tanpa upgrade yang dapat dipertimbangkan: gunakan PostgreSQL `pg_dump` dari mesin pengguna dengan connection string database Supabase (secret disimpan lokal, tidak dikirim ke chat atau Git). Untuk backup yang lebih lengkap, gunakan custom-format dump yang mencakup schema dan data, lalu verifikasi file dump. Alternatif ekspor CSV per tabel dari Dashboard hanya mencadangkan data tabel yang dipilih dan bukan pengganti backup penuh.
- Sebelum memberi perintah backup yang spesifik, pastikan metode koneksi database yang tersedia (direct connection atau session pooler) dan apakah `pg_dump` terpasang. Jangan meminta pengguna menempelkan database password/connection string rahasia ke percakapan.
- Langkah berikutnya: siapkan dan verifikasi backup lokal gratis terlebih dahulu. Setelah itu pengguna dapat memutuskan apakah akan menjalankan `pnpm dlx supabase db push --remote`. Jika pengguna memilih tetap tanpa backup, jelaskan risiko production secara eksplisit dan minta persetujuan sadar sebelum memberi langkah push.

### Lingkungan backup lokal — 2026-11-24

- Pengguna mengonfirmasi lingkungan terminal: Kali Linux ARM64 (aarch64) pada kernel Android 14, hostname localhost, direktori kerja ~/web-sekolah.
- Rencana backup gratis menggunakan PostgreSQL pg_dump dari lingkungan Linux tersebut; belum ada perintah backup dijalankan dan belum ada file dump terverifikasi.
- Langkah pemeriksaan awal: command -v pg_dump dan pg_dump --version. Setelah hasil diketahui, tentukan apakah perlu memasang client PostgreSQL yang sesuai sebelum koneksi ke Supabase.
- Jangan meminta atau mencatat database password/connection string rahasia di chat maupun repository.

### Pemeriksaan pg_dump — 2026-11-24

- Pengguna menjalankan command -v pg_dump dan pg_dump --version pada Kali Linux ARM64; executable tersedia di /usr/bin/pg_dump, versi PostgreSQL 18.6 (Debian 18.6-3).
- Tidak perlu memasang PostgreSQL client tambahan pada tahap ini. Belum ada koneksi database atau backup yang dijalankan.
- Langkah berikutnya: ambil URI koneksi database dari Supabase Dashboard secara lokal, simpan secara aman sebagai environment variable tanpa menempelkannya ke chat/repository, lalu uji koneksi dan jalankan dump custom-format schema + data. Pastikan host/port sesuai mode koneksi Supabase dan jaringan IPv4/IPv6 lingkungan pengguna.


### 2026-11-24 — Mulai menyiapkan backup PostgreSQL dari Proot Kali/Termux

- Pengguna meminta pendampingan langkah demi langkah untuk membuat backup Supabase melalui PostgreSQL Direct Connection dari Proot Kali Linux di Termux Android, tetap pada paket gratis.
- Sebelum melanjutkan, README.md dan progress.md branch main dibaca ulang; commit terbaru yang terlihat saat audit adalah `2e9133e9fe3f0ccc77959c6a57b816cf152ca217` (`docs: record pg_dump availability`). README menegaskan stack Next.js 16.4.6, React 19, Tailwind CSS 4, Supabase PostgreSQL/Auth/RLS/Storage, Cloudflare Workers/OpenNext, dan kewajiban membaca serta memperbarui progress.md.
- progress.md mengonfirmasi enam migrasi konten `20261124100000`–`20261124150000` masih pending pada remote; dry-run sebelumnya hanya mem-preview keenam migrasi dan tidak mengubah database. Jangan jalankan `db push` sebelum backup selesai diverifikasi dan pengguna menyetujui langkah berikutnya.
- Lingkungan pengguna: Proot Kali Linux pada Termux/Android, ARM64/aarch64; `pg_dump` tersedia di `/usr/bin/pg_dump`, versi PostgreSQL 18.6.
- Dokumentasi resmi Supabase yang diperiksa (2026-11-24): untuk `pg_dump`/backup gunakan Direct Connection bila jaringan mendukung IPv6; jika tidak, gunakan Shared Pooler Session Mode (port 5432, IPv4). Jangan gunakan Transaction Pooler (port 6543) untuk backup. Connection string harus disalin dari Dashboard → Connect, bukan merakit host pooler sendiri. Direct connection Supabase Free menggunakan IPv6; session pooler tersedia melalui IPv4.
- Referensi resmi: https://supabase.com/docs/guides/database/connecting-to-postgres dan https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore.
- Tahap berikutnya: periksa kemampuan IPv6/DNS/TLS dari Proot, lalu pilih direct connection atau session pooler sesuai hasil; uji koneksi tanpa menampilkan password; jalankan custom-format `pg_dump` dengan schema + data; verifikasi file menggunakan `pg_restore --list` dan ukuran/checksum. Secret hanya boleh dimasukkan secara lokal, tidak di chat atau Git.
- Status saat catatan ini dibuat: belum ada koneksi PostgreSQL yang diuji, belum ada file backup, dan keenam migrasi konten tetap pending.


### 2026-11-24 — Pengguna melaporkan koneksi Session Pooler berhasil

- Pengguna melaporkan sudah berhasil masuk/terhubung ke PostgreSQL Supabase menggunakan Session Pooler.
- Tahap berikutnya adalah menjalankan `pg_dump` dari shell Proot Kali (bukan dari prompt interaktif SQL `postgres=>`). Jika masih berada di psql, keluar dengan `\\q` terlebih dahulu.
- Disiapkan folder backup privat di luar repository: `$HOME/db-backups` dengan permission direktori `700`.
- Belum ada bukti bahwa `pg_dump` sudah dijalankan atau file dump sudah terbentuk. Jangan menandai backup selesai sebelum arsip diverifikasi dengan `pg_restore --list` dan checksum.
- Untuk menyusun perintah yang tepat, perlu mengetahui host pooler dan username persis dari Dashboard → Connect (bukan password); port Session Pooler umumnya 5432 dan database umumnya postgres, tetapi nilai aktual harus mengikuti connection string proyek.
- Tetap jangan menjalankan migrasi production sampai backup diverifikasi dan pengguna menyetujui.


## 2026-11-24 — Session Pooler details confirmed for database backup
- User supplied the Session Pooler endpoint shown in Supabase Dashboard: host `aws-1-ap-northeast-2.pooler.supabase.com`, username `postgres.nofznzznzjsvnkrmzpwx`.
- Backup connection parameters to use: port `5432`, database `postgres`, Session Pooler host and username above.
- `pg_dump` has not yet been executed; no backup file or checksum has been verified. Do not run pending production migrations until a backup archive is created and validated.
- Keep the backup outside the Git repository in `$HOME/db-backups` with directory permissions `700`; prompt for the database password interactively rather than placing it in shell history or sharing it in chat.


## 2026-11-24 — Production database backup created and archive validated
- User successfully ran `pg_dump` against the Supabase Session Pooler and created `/home/kali/db-backups/web-sekolah-20261124-003809.dump`.
- Reported file size: 497 KB. Archive metadata: CUSTOM format, gzip compression, 769 TOC entries; source PostgreSQL 17.12; client `pg_dump` 18.6.
- `pg_restore --list "$BACKUP_FILE" | head -n 30` returned archive metadata and schema entries without a reported error, establishing that the archive is readable/listable. This is not a full restore test.
- Reported SHA-256: `c4eeda6de6efb3aeb853a0e401d8dfb2cb0cb5fd9f7cf4e71901459948ae8fd2`.
- File was stored outside the repository under `/home/kali/db-backups`; displayed mode was `-rw-rw----` and the containing directory was previously set to mode `700`. Recommend tightening the archive file itself to mode `600` with `chmod 600 "$BACKUP_FILE"`.
- The six reviewed content migrations remain pending production application. Do not claim a restore test or migration execution occurred. Before applying, confirm the backup file and checksum remain available, then run the previously reviewed migration push and verify remote migration status.


## 2026-11-24 — Migrasi konten production diterapkan (konfirmasi pengguna)
- Pengguna mengonfirmasi bahwa perintah `pnpm dlx supabase db push --remote` dan verifikasi `pnpm dlx supabase migration list --remote` sudah dijalankan tanpa masalah.
- Berdasarkan konfirmasi pengguna, keenam migrasi konten yang sebelumnya pending telah diterapkan ke Supabase production: `20261124100000`, `20261124110000`, `20261124120000`, `20261124130000`, `20261124140000`, dan `20261124150000`.
- Catatan evidensi: output terminal lengkap tidak ditempel ulang pada percakapan ini; status dicatat sebagai konfirmasi langsung pengguna, bukan verifikasi independen oleh asisten.
- Dampak skema yang diharapkan: fondasi tabel konten/akademik, Galeri, Prestasi, Agenda, default guru unpublished, permission publikasi, dan penguatan policy RLS publikasi.
- Langkah berikutnya: audit implementasi CMS Pengumuman dan pola CMS Berita terkini pada branch `main`, lalu implementasikan Pengumuman dengan validasi, server-side permission checks, activity log, RLS, UI draft/publish/archive/scheduling, test, dan pembaruan progress.


## 2026-11-24 — Implementasi CMS Pengumuman (kode awal)
- Menambahkan schema validasi Zod untuk judul, slug, ringkasan, isi, status, waktu publikasi, masa berlaku, dan path lampiran: `src/features/content/announcement-schema.ts`.
- Menambahkan server actions create/update/delete di `src/features/content/announcement-actions.ts`. Semua operasi memeriksa sesi dan permission di server; publikasi memerlukan `announcements:publish`; perubahan dicatat melalui activity log; route publik dan admin direvalidasi.
- Waktu input `datetime-local` dikonversi secara eksplisit dari Asia/Jakarta (UTC+7), termasuk validasi kalender; tanggal kedaluwarsa wajib setelah waktu publikasi.
- Menambahkan editor, daftar admin, halaman tambah/edit, konfirmasi hapus, dan unit test schema.
- Mengaktifkan tautan `/admin/pengumuman` pada navigasi admin dengan permission `announcements:view`. Route lain yang belum diimplementasikan tetap disembunyikan.
- Lampiran saat ini menerima path objek Storage pada bucket `public-docs`; unggah file langsung dari editor belum diimplementasikan dan perlu tahap terpisah.
- Audit menemukan policy RLS pada migrasi `20261124150000_content_publication_guard.sql` sudah memeriksa `announcements:publish`, tetapi permission tersebut belum didaftarkan oleh migrasi sebelumnya. Menambahkan migrasi baru `20261124160000_announcement_publish_permission.sql` untuk mendaftarkan permission tersebut. Migrasi baru ini **belum diterapkan** ke Supabase production.
- Commit implementasi: schema `5d4d0c2`; actions `2da25f9`; editor `e21ef7b`; delete form `66011fa`; daftar admin `fee57e2`; halaman tambah `5c206a4`; halaman edit `f048c3c`; unit test `a21cb9e`; migrasi permission `ec876e5`; navigasi `4c8caa1`; validasi kalender `ed5ff8b`.
- **Status pengujian:** belum dijalankan oleh asisten (tidak tersedia checkout lokal repository). Pengguna perlu menarik commit terbaru lalu menjalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`. Jangan anggap CMS siap produksi sebelum hasil pemeriksaan dikonfirmasi.
- **Langkah berikutnya:** review diff lengkap, jalankan pemeriksaan lokal, perbaiki semua error, preview migrasi `20261124160000`, terapkan ke production setelah konfirmasi, lalu uji alur draft/publish/schedule/expiry dan RLS dengan akun berpermission berbeda.


## 2026-11-24 — Dry-run migrasi permission Pengumuman production (konfirmasi pengguna)
- Pengguna mengonfirmasi dry-run terakhir untuk migrasi production berhasil tanpa error.
- Migrasi tambahan yang menunggu penerapan berdasarkan status proyek adalah `20261124160000_announcement_publish_permission.sql`, yang mendaftarkan permission `announcements:publish` agar konsisten dengan RLS publication guard yang sudah diterapkan pada migrasi `20261124150000`.
- Migrasi ini hanya menjalankan `INSERT ... ON CONFLICT (code) DO NOTHING`; tidak menghapus atau mengubah data konten yang sudah ada.
- Status migrasi `20261124160000` tetap **Pending** sampai `pnpm dlx supabase db push --remote` berhasil dan `pnpm dlx supabase migration list --remote` menunjukkan versi tersebut tercatat di Remote.
- Backup production yang telah diverifikasi sebelumnya: `/home/kali/db-backups/web-sekolah-20261124-003809.dump`; SHA-256 `c4eeda6de6efb3aeb853a0e401d8dfb2cb0cb5fd9f7cf4e71901459948ae8fd2`. Ini adalah validasi arsip dengan `pg_restore --list`, bukan uji restore penuh.
- Langkah berikutnya: terapkan migrasi tersebut ke project ref `nofznzznzjsvnkrmzpwx`, lalu verifikasi riwayat migrasi remote. Jangan tandai selesai sebelum hasil terminal dikonfirmasi.


## 2026-11-24 — Migrasi permission Pengumuman production berhasil diverifikasi
- Pengguna mengonfirmasi `pnpm dlx supabase db push --remote` selesai tanpa error.
- Output `pnpm dlx supabase migration list --remote` yang dibagikan pengguna menunjukkan migrasi `20261124160000` tercatat sama pada kolom Local dan Remote dengan waktu UTC `2026-11-24 16:00:00`.
- Dengan demikian seluruh migrasi sampai `20261124160000_announcement_publish_permission.sql` sudah tercatat diterapkan pada Supabase production project `nofznzznzjsvnkrmzpwx`.
- Catatan CLI: pesan pnpm tentang native binary/build scripts dan notifikasi versi Supabase CLI lebih baru muncul sebagai peringatan/informasi; tidak menghalangi push maupun pembacaan daftar migrasi pada sesi ini.
- Langkah berikutnya: lanjutkan validasi aplikasi CMS Pengumuman di lokal (typecheck, lint, unit test), kemudian uji permission/RLS dengan akun yang memiliki dan tidak memiliki `announcements:publish`. Jangan menganggap pengujian aplikasi sudah lulus sebelum hasilnya dikonfirmasi.


## 2026-11-24 — Validasi CMS Pengumuman lulus
- Pengguna mengonfirmasi pemeriksaan lokal setelah implementasi CMS Pengumuman: `pnpm typecheck`, `pnpm lint`, dan `pnpm test` semuanya **lolos**.
- Konfirmasi ini mencakup pemeriksaan statis dan unit test yang dijalankan pengguna pada checkout lokal; asisten tidak menjalankan perintah tersebut secara independen.
- Migrasi `20261124160000_announcement_publish_permission.sql` sudah tercatat sama pada Local dan Remote berdasarkan output `supabase migration list --remote` yang sebelumnya dibagikan pengguna.
- Status CMS Pengumuman: implementasi awal dan pemeriksaan otomatis lulus. Pengujian fungsional UI, alur draft/publikasi/penjadwalan/kedaluwarsa, serta verifikasi RLS menggunakan akun dengan permission berbeda masih perlu dilakukan.
- Catatan koreksi terhadap bagian historis di atas: beberapa paragraf lama masih menyebut migrasi konten dan permission Pengumuman berstatus pending, serta menyebut CMS Pengumuman belum diimplementasikan. Itu adalah status pada saat catatan lama dibuat dan **sudah digantikan** oleh bukti konfirmasi yang lebih baru pada bagian ini.
- Langkah berikutnya: audit skema dan pola UI Galeri yang sudah ada, kemudian implementasikan CMS Galeri dengan server-side permission checks, validasi, activity log, RLS, dan pengelolaan gambar yang aman. Jangan mengubah migrasi yang sudah diterapkan; buat migrasi baru hanya jika audit membuktikan memang diperlukan.


## 2026-11-24 — Implementasi awal CMS Galeri
- Audit branch `main`: halaman publik `/galeri` dan `/galeri/[slug]`, query publik, tabel `galleries` dan `gallery_images`, serta bucket Storage publik `media` sudah tersedia. Route admin Galeri sebelumnya belum tersedia.
- Menambahkan schema Zod `src/features/content/gallery-schema.ts` dan unit test `tests/unit/gallery-schema.test.ts`.
- Menambahkan server actions `src/features/content/gallery-actions.ts` untuk create/update album, upload foto ke bucket `media`, hapus foto, hapus album, revalidasi halaman publik/admin, dan activity log. Upload memvalidasi signature byte, MIME, dan ukuran menggunakan helper `validateUpload`; path objek dibuat acak di folder `galleries/`.
- Menambahkan editor album dengan upload multi-foto (maksimal 20 file per submit, maksimal 3 MB per file), preview foto, status draft/published/archived, penjadwalan Asia/Jakarta, urutan album, dan kontrol hapus foto.
- Menambahkan halaman admin daftar/tambah/edit Galeri dan mengaktifkan route `/admin/galeri` pada sidebar. Permission server-side mengikuti `galleries:view/create/update/delete/publish`; RLS tetap menjadi lapisan keamanan database dan Storage.
- Mengatur batas body Server Actions Next.js menjadi 64 MB agar pengiriman foto tidak terhenti pada batas default 1 MB; tiap file tetap dibatasi helper Storage pada 3 MB dan jumlah file dibatasi 20.
- Audit menemukan policy lama `gallery_images_insert` meminta permission `galleries:create` DAN `galleries:update`, sehingga pemilik permission update saja tidak dapat menambah foto. Menambahkan migrasi baru `20261124170000_gallery_image_update_permission.sql` yang menyelaraskan insert foto dengan `galleries:update`. Migrasi ini **belum diterapkan ke production**.
- Commit implementasi: schema `448f35e`; test `e5431f5`; actions `1ba871f`; delete forms `94c4236`, `5f3db31`; editor `dca191c`; halaman admin `5dafbc7`, `f112b59`, `ba97db6`; navigasi `0fa1f0f`; konfigurasi batas upload `e1467a3`; migrasi policy `9f05c46`.
- **Status pengujian CMS Galeri:** belum dijalankan/dikonfirmasi. Pengguna perlu menarik commit terbaru lalu menjalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`. Asisten tidak memiliki checkout lokal untuk menjalankan perintah tersebut.
- **Status database:** migrasi sampai `20261124160000` sudah dikonfirmasi diterapkan pengguna. Migrasi baru `20261124170000` masih pending; jangan menjalankan fitur uji tulis Galeri terhadap production sampai migrasi ini diterapkan. Lakukan dry-run dan verifikasi daftar migrasi sebelum push.
- Catatan koreksi: bagian status migrasi dan tindak lanjut lama di atas adalah catatan historis. Bukti yang lebih baru pada entri ini dan entri validasi CMS Pengumuman menjadi acuan status saat ini.
- Langkah berikutnya: jalankan pemeriksaan otomatis lokal; perbaiki temuan; preview dan terapkan migrasi `20261124170000` setelah review; lalu uji create/edit album, upload file valid/invalid, hapus foto/album, publikasi terjadwal, serta akses RLS dengan role yang memiliki dan tidak memiliki permission Galeri.


### Review keamanan lanjutan CMS Galeri — 2026-11-24
- Menutup celah pada penghapusan foto: server action sekarang memeriksa status album induk dan mensyaratkan `galleries:publish` bila foto dihapus dari album yang sudah published. Ini mencegah pengguna dengan `galleries:update` saja mengubah konten album terbit melalui action langsung.
- Audit Storage menemukan helper `can_manage_media()` sebelumnya tidak mencakup `galleries:delete`. Tanpa izin tersebut, penghapusan album/foto dapat menghapus row database tetapi gagal membersihkan objek Storage. Menambahkan migrasi `20261124180000_gallery_storage_delete_permission.sql` untuk memasukkan permission tersebut.
- Migrasi Galeri yang sekarang menunggu penerapan: `20261124170000_gallery_image_update_permission.sql` dan `20261124180000_gallery_storage_delete_permission.sql`. Keduanya **belum diterapkan ke production**; jangan tandai selesai sebelum dry-run, push, dan daftar remote dikonfirmasi pengguna.
- Commit review keamanan: `2dae8d0`; migrasi Storage: `315ea61`.
- Status tes tetap belum dijalankan setelah perubahan Galeri. Jalankan kembali typecheck, lint, dan unit test setelah menarik commit terbaru.

- Perapian tambahan: urutan foto baru sekarang dimulai setelah `sort_order` tertinggi yang sudah ada, sehingga penambahan foto pada album lama tidak menimpa urutan foto sebelumnya. Commit: `9f09a78`.


## 2026-11-24 — Validasi kode CMS Galeri lulus
- Pengguna mengonfirmasi bahwa pemeriksaan setelah implementasi awal CMS Galeri berjalan tanpa error. Dicatat sebagai konfirmasi pengguna untuk `pnpm typecheck`, `pnpm lint`, dan `pnpm test` pada checkout lokal.
- Pemeriksaan ini dilakukan setelah implementasi Galeri, termasuk review keamanan penghapusan foto dan penambahan migrasi policy Storage. Asisten tidak menjalankan perintah lokal secara independen.
- Status migrasi production tetap **belum terkonfirmasi diterapkan**: pengguna belum memberikan output `supabase migration list --remote` yang menunjukkan versi `20261124170000` dan `20261124180000`. Tidak boleh menganggap migrasi sudah diterapkan hanya dari hasil tes kode.
- Tindakan operasional berikutnya: jalankan `pnpm dlx supabase db push --remote`, lalu `pnpm dlx supabase migration list --remote`; pastikan dua versi Galeri tersebut muncul pada daftar Local dan Remote. Setelah itu lakukan uji fungsional upload, penghapusan, dan permission dengan akun berbeda.


## 2026-11-24 — CMS Galeri: migrasi dan hardening action
- Pengguna mengonfirmasi langkah penerapan migrasi Galeri berjalan aman/tanpa masalah. Berdasarkan konfirmasi tersebut, migrasi `20261124170000_gallery_image_update_permission.sql` dan `20261124180000_gallery_storage_delete_permission.sql` dicatat telah diterapkan ke Supabase production. Output lengkap daftar migrasi tidak ditempel pada pesan konfirmasi ini, sehingga status merupakan konfirmasi pengguna, bukan verifikasi independen.
- Pengguna sebelumnya juga mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos untuk implementasi CMS Galeri. Pemeriksaan tersebut dilakukan pada checkout lokal pengguna.
- Audit lanjutan menemukan celah pada `saveGallery`: pengguna yang memiliki `galleries:update` tetapi tidak `galleries:publish` berpotensi mengubah metadata atau menurunkan status album yang sudah published melalui pemanggilan Server Action langsung, meskipun halaman edit sudah membatasi UI.
- Memperbaiki `src/features/content/gallery-actions.ts`: saat update, action sekarang membaca status album yang ada dan mewajibkan `galleries:publish` jika album lama sudah published atau status baru akan published. Pemeriksaan dilakukan di server sebelum update database. Commit: `d767753977fe06e8dcc72c0e90683d5977b66a66`.
- Status pengujian setelah hardening terakhir: belum dikonfirmasi. Jalankan ulang `pnpm typecheck`, `pnpm lint`, dan `pnpm test` setelah `git pull`.
- Tindak lanjut: uji alur CRUD album, upload foto, hapus foto/album, dan pastikan akun tanpa `galleries:publish` tidak dapat mengubah album terbit melalui UI maupun Server Action; lalu verifikasi objek Storage benar-benar terhapus dan halaman publik ter-revalidate.


## 2026-11-24 — Validasi hardening CMS Galeri lulus
- Pengguna mengonfirmasi pemeriksaan lokal setelah commit hardening Galeri `d767753` aman/tanpa error. Dicatat sebagai konfirmasi pengguna bahwa `pnpm typecheck`, `pnpm lint`, dan `pnpm test` kembali lolos.
- Konfirmasi tersebut berlaku setelah penambahan pemeriksaan status album lama pada `saveGallery`; asisten tidak menjalankan pemeriksaan secara independen.
- Tindak lanjut: lanjutkan CMS Prestasi dengan pola validasi schema, server actions, RBAC/RLS, activity log, halaman admin, unit test, dan pembaruan dokumen ini.


## 2026-11-24 — Implementasi CMS Prestasi (tahap awal)
- Pengguna mengonfirmasi pemeriksaan hardening Galeri sebelumnya aman. Konfirmasi hasil pemeriksaan Galeri dicatat pada entri tepat di atas.
- Menambahkan schema Zod dan unit test untuk data prestasi: judul, slug, deskripsi, penerima, tingkat, tanggal pencapaian, status publikasi, waktu publikasi, dan urutan.
- Menambahkan Server Actions create/update/delete dengan pemeriksaan sesi dan permission server-side, validasi tanggal dan waktu Asia/Jakarta, upload gambar ke bucket `media` memakai validasi signature/MIME/ukuran dan object path acak, activity log, serta revalidasi halaman publik/admin.
- Menambahkan editor prestasi, preview gambar, halaman admin daftar/tambah/edit, konfirmasi penghapusan, dan mengaktifkan menu `/admin/prestasi`.
- Audit RLS menemukan update row prestasi published sebelumnya hanya memeriksa permission `achievements:update` pada row lama dan hanya mensyaratkan `achievements:publish` bila row baru berstatus published. Ini memungkinkan pengeditan isi prestasi terbit oleh pengguna tanpa permission publish. Migrasi baru `20261124190000_achievement_publication_storage_guard.sql` memperketat USING dan WITH CHECK agar perubahan row published memerlukan permission publish.
- Migrasi 1900 juga menambahkan `achievements:delete` ke helper `can_manage_media()`, agar penghapusan prestasi dapat membersihkan gambar di Storage. Migrasi ini **belum diterapkan ke production**.
- Commit utama: schema `809eb33`; unit test `fdb142a`; actions `edd12b6`; delete form `738e5be`; editor `8a1f9d3`; daftar admin `2418fc6`; tambah `fa6181b`; edit `66fd99a`; migrasi RLS/Storage `ea5f70b`; navigasi `f146c53`.
- **Status pengujian CMS Prestasi:** belum dijalankan/dikonfirmasi oleh pengguna. Setelah menarik commit terbaru, jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`; perbaiki setiap error sebelum menguji alur UI.
- **Status database:** migrasi `20261124190000` masih pending. Lakukan dry-run, pastikan backup production tersedia, terapkan setelah review, lalu verifikasi Local dan Remote pada `supabase migration list --remote`.
- Tindak lanjut pengujian fungsional: buat/edit/hapus prestasi; upload gambar valid dan tolak file invalid; jadwalkan publikasi; uji akun tanpa `achievements:publish` tidak dapat membuat atau mengubah prestasi terbit; pastikan gambar Storage ikut dibersihkan saat penghapusan.


## 2026-11-24 — Validasi awal CMS Prestasi dan migrasi production
- Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` lolos setelah implementasi awal CMS Prestasi.
- Pengguna menjalankan dry-run `pnpm dlx supabase db push --remote --dry-run`; output hanya menampilkan satu migrasi yang akan didorong: `20261124190000_achievement_publication_storage_guard.sql`. Tidak ada migrasi lain yang tertunda.
- Output `pnpm dlx supabase migration list --remote` yang dibagikan pengguna menunjukkan `20261124190000` tercatat sama pada kolom Local dan Remote dengan waktu UTC `2026-11-24 19:00:00`. Ini mengonfirmasi migrasi guard publikasi dan Storage Prestasi telah tercatat diterapkan pada production project `nofznzznzjsvnkrmzpwx`.
- Pesan CLI tentang pnpm native binary, file `.gitkeep`, dan versi Supabase CLI baru merupakan peringatan/informasi; tidak menghalangi daftar migrasi.
- Status: pemeriksaan otomatis kode dan riwayat migrasi production terkonfirmasi oleh pengguna. Asisten tidak menjalankan tes atau mengakses database secara independen.
- Berikutnya: uji fungsional CMS Prestasi dan otorisasi menggunakan akun berbeda: create/edit draft, upload gambar valid/invalid, penjadwalan publikasi, pembatasan perubahan konten published untuk akun tanpa `achievements:publish`, penghapusan prestasi, dan verifikasi objek Storage benar-benar terhapus. Periksa juga halaman publik `/prestasi` dan detailnya.


## 2026-11-24 — Kompresi gambar otomatis CMS Prestasi
- Menambahkan komponen client-side `src/features/content/compressed-image-input.tsx` dan mengintegrasikannya ke editor CMS Prestasi.
- Sebelum form dikirim, gambar diproses di browser: orientasi mengikuti decoder browser, dimensi maksimum 1920 px, metadata gambar tidak ikut disalin oleh proses canvas, dan hasil dikodekan ulang ke WebP (fallback JPEG).
- Kompresi mencoba beberapa tingkat kualitas dan pengurangan dimensi hingga target sekitar 2,7 MB; batas hasil akhir tetap 3 MB sesuai kebijakan bucket `media`.
- Ukuran sumber dibatasi 25 MB dan jumlah piksel dibatasi 40 juta untuk mengurangi risiko konsumsi memori berlebihan pada perangkat pengguna. Jika pemrosesan gagal, input dikosongkan dan pengguna mendapat pesan; file asli tidak otomatis dikirim.
- Keamanan server tidak dilonggarkan: `achievement-actions.ts` tetap menjalankan `validateUpload` terhadap ukuran, signature byte, MIME aktual, serta MIME yang dideklarasikan, dan tetap menggunakan object path acak. Kompresi browser bukan pengganti validasi server dan dapat dilewati oleh pemanggil yang memanipulasi request.
- Tidak ada migrasi database atau perubahan policy Storage pada pekerjaan ini.
- Commit komponen: `589aa90`; integrasi editor: `a5ab64c`; perapian tipe event: `da846fa`.
- Status: perubahan sudah di-commit ke `main`; pemeriksaan typecheck/lint/test belum dijalankan setelah perubahan. Pengguna perlu `git pull` lalu menjalankan seluruh pemeriksaan.
- Catatan diagnosis: kegagalan unggah sebelumnya belum dapat dipastikan hanya karena ukuran. Jika kompresi berhasil tetapi upload tetap gagal, catat pesan error di UI dan kode/detail server log `admin_achievement_upload_failed`; penyebab lain dapat berupa sesi/permission, policy Storage, jaringan, atau batas request.


## 2026-11-24 — Implementasi awal CMS Agenda Sekolah
- Mengimplementasikan area admin Agenda pada `/admin/agenda`, halaman tambah, halaman edit, editor, dan konfirmasi hapus.
- Menambahkan schema Zod `event-schema.ts` serta unit test `event-schema.test.ts` untuk judul, slug, ringkasan, deskripsi, lokasi, URL HTTPS, waktu mulai/selesai, status publikasi, dan urutan.
- Server Actions `event-actions.ts` memeriksa sesi dan permission `events:create/update/delete/publish` di server; memvalidasi tanggal/waktu lokal Asia/Jakarta, rentang waktu, URL pendaftaran HTTPS, file melalui `validateUpload`, dan object path acak; mencatat activity log; membersihkan gambar lama atau upload baru yang gagal disimpan; serta me-revalidate route publik/admin.
- Editor Agenda mendukung draft, published, archived, penjadwalan publikasi, gambar dengan kompresi browser melalui komponen yang sama seperti Prestasi, waktu mulai/selesai, lokasi, ringkasan, deskripsi, dan tautan pendaftaran.
- Mengaktifkan menu Agenda di sidebar hanya setelah route admin tersedia. Pemeriksaan route tetap disaring dengan permission `events:view`.
- Review keamanan menemukan policy RLS `events_update` sebelumnya hanya mensyaratkan `events:publish` pada row baru berstatus published. Hal itu belum melindungi isi row lama yang sudah published. Migrasi baru `20261124200000_event_publication_storage_guard.sql` memperketat USING dan WITH CHECK, serta menambahkan `events:delete` ke helper Storage `can_manage_media()` agar gambar dapat dibersihkan ketika agenda dihapus.
- File utama: `src/features/content/event-schema.ts`, `event-actions.ts`, `event-editor.tsx`, `delete-event-form.tsx`; route `src/app/admin/agenda/**`; test `tests/unit/event-schema.test.ts`; migrasi `supabase/migrations/20261124200000_event_publication_storage_guard.sql`.
- Commit implementasi schema: `d0e40cb6a73a53f1ddaa4a378ce1bee3b567aea9`; test: `8abf40de1f0fdd190dfced9542df7d22ba51aff3`; actions: `00337ee4ff27f2971735c481828e61534a394673`; delete form: `37c95ebed50df688f589a2b39f73b23b7e3305da`; editor: `b6d5e84515bdeb1032e5586d1f98ea06f7566105`; daftar: `2b0e1c02e6448a3acf61397e5e200434f3409bfc`; tambah: `1ff325eff70e135920d1d90b5530434b018aa41f`; edit: `18e53ba600d882bc5706121f17b87cc7b60cad61`; migrasi: `463651b467d4df4f1d9401c1c2b788c45a4e9c82`; navigasi: `c1d28769cdc511339c448e0fea4258e2b411293c`.
- **Status pemeriksaan:** belum dijalankan setelah implementasi Agenda. Jangan menganggap typecheck, lint, unit test, build, atau uji browser berhasil sebelum pengguna mengonfirmasi hasilnya.
- **Status migrasi:** `20261124200000_event_publication_storage_guard.sql` baru ditambahkan dan belum dikonfirmasi diterapkan ke Supabase production. Lakukan dry-run, tinjau bahwa hanya migrasi ini yang pending (atau tinjau semua yang tampil), lalu push dan verifikasi `supabase migration list --remote`.
- Tindak lanjut: jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`; perbaiki error bila ada. Setelah lolos, uji create/edit/delete agenda, upload gambar, jadwal publikasi, halaman publik `/agenda` dan detail, serta akun tanpa `events:publish` yang mencoba mengubah agenda terbit melalui UI dan pemanggilan Server Action langsung.


## 2026-11-24 — Migrasi guard CMS Agenda diterapkan ke production
- Pengguna mengonfirmasi menjalankan `pnpm dlx supabase db push --remote` pada project production `Web-Sekolah` (project ref `nofznzznzjsvnkrmzpwx`). CLI menerapkan tepat satu migrasi: `20261124200000_event_publication_storage_guard.sql`; output berakhir dengan `Finished supabase db push.`
- Pengguna kemudian menjalankan `pnpm dlx supabase migration list --remote`. Versi `20261124200000` tercatat sama pada kolom Local dan Remote dengan waktu UTC `2026-11-24 20:00:00`. Ini mengonfirmasi migrasi guard publikasi Agenda dan permission penghapusan media Agenda sudah tercatat diterapkan pada production.
- Tidak ada migrasi lain yang tertunda pada daftar yang dibagikan: semua versi dari `20261123091127` sampai `20261124200000` tercatat sinkron Local/Remote.
- Peringatan pnpm tentang native binary/build scripts, pesan melewati `.gitkeep`, dan notifikasi Supabase CLI versi baru tidak menghalangi operasi; push dan pembacaan daftar migrasi selesai tanpa error.
- Konfirmasi ini hanya membuktikan penerapan dan pencatatan migrasi. Pemeriksaan `pnpm typecheck`, `pnpm lint`, `pnpm test` setelah implementasi CMS Agenda serta uji fungsional/RLS masih belum dikonfirmasi.
- Langkah berikutnya: pengguna menjalankan typecheck, lint, dan unit test; setelah lolos, uji CRUD Agenda, upload gambar, penjadwalan, halaman publik, dan pembatasan perubahan Agenda terbit untuk akun tanpa `events:publish`.


## 2026-11-24 — Validasi kode CMS Agenda lulus
- Pengguna mengonfirmasi setelah menarik perubahan CMS Agenda dan menerapkan migrasi production bahwa `pnpm typecheck`, `pnpm lint`, dan `pnpm test` semuanya berhasil tanpa error.
- Konfirmasi berlaku untuk checkout lokal pengguna setelah implementasi awal CMS Agenda dan migrasi guard `20261124200000_event_publication_storage_guard.sql` diterapkan serta tercatat sinkron pada Local/Remote.
- Asisten tidak menjalankan tes secara independen. Build Cloudflare/OpenNext dan pengujian browser/fungsional masih belum diverifikasi.
- Tahap admin berikutnya dipilih: CMS Guru, menggunakan tabel `teachers` yang sudah tersedia. Audit awal menunjukkan permission CRUD dasar dan policy RLS telah ada; perlu menambahkan kontrol publikasi yang aman untuk row guru terbit serta memastikan permission Storage saat mengganti/menghapus foto. Tidak perlu membuat ulang tabel guru.


## 2026-11-24 — Implementasi awal CMS Guru
- Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, dan `pnpm test` setelah CMS Agenda semuanya lolos tanpa error. Konfirmasi tersebut dicatat sebelum memulai modul berikutnya.
- Audit database: tabel `teachers` sudah tersedia dari fondasi konten; kolom mencakup nama, slug, nomor pegawai, jabatan, relasi jurusan/unit, pendidikan, biografi, foto, email, urutan, dan `is_published`. Migrasi `20261124110000_default_teacher_unpublished.sql` sudah mengubah default publikasi menjadi false. Tidak membuat ulang tabel atau mengubah migrasi lama.
- Menambahkan schema Zod `src/features/content/teacher-schema.ts` dan unit test `tests/unit/teacher-schema.test.ts`.
- Menambahkan Server Actions `src/features/content/teacher-actions.ts` untuk create/update/delete dengan pemeriksaan sesi dan permission server-side (`teachers:create/update/delete/publish`), validasi data, validasi signature/MIME/ukuran foto melalui `validateUpload`, object path acak di bucket `media`, pembersihan foto lama/upload gagal, activity log, dan revalidasi halaman `/guru` serta admin.
- Menambahkan editor `teacher-editor.tsx` dengan profil guru, nomor pegawai, jabatan, jurusan/unit, pendidikan, email dinas (tidak ditampilkan publik), biografi, urutan, status tampil, dan foto terkompresi otomatis melalui komponen `CompressedImageInput` yang sama dengan Prestasi/Agenda.
- Menambahkan route admin daftar, tambah, dan edit pada `src/app/admin/guru/**`, konfirmasi hapus, serta mengaktifkan menu Guru pada sidebar.
- Keamanan: RLS lama untuk guru hanya memeriksa permission update/create tanpa permission publikasi khusus. Menambahkan migrasi `20261124210000_teacher_publication_storage_guard.sql` untuk mendaftarkan `teachers:publish`, mewajibkan permission tersebut saat membuat/mengubah row yang tampil, dan menambahkan `teachers:delete` serta `events:delete` ke daftar permission yang dapat mengelola objek media Storage. Policy RLS melindungi pemanggilan langsung di luar UI.
- File/commit: schema `ba78f8e`; test `d99f772`; actions `4855a68`; delete form `54f99aa`; editor `905e42d` dan perbaikan permission checkbox `3db6d84`; daftar `02fb661`; tambah `5548bd1`; edit `17b716e`; migrasi `1656a03`; navigasi `9601b66`.
- Tidak ada perubahan query publik `getPublicTeachers`; halaman publik `/guru` tetap memakai field publik yang tidak mencakup nomor pegawai atau email.
- **Status pengujian CMS Guru:** belum dijalankan setelah implementasi. Pengguna perlu menarik commit terbaru dan menjalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`. Asisten tidak menjalankan tes secara independen.
- **Status migrasi:** `20261124210000_teacher_publication_storage_guard.sql` baru ditambahkan dan belum diterapkan ke production. Lakukan dry-run, tinjau bahwa hanya migrasi ini yang pending, pastikan backup tersedia, kemudian push dan verifikasi Local/Remote pada `supabase migration list --remote`.
- Langkah uji fungsional setelah pemeriksaan otomatis: buat/edit/hapus profil guru; upload foto valid dan tolak file invalid; pastikan akun tanpa `teachers:publish` tidak dapat membuat atau mengubah profil tampil melalui UI maupun Server Action langsung; uji foto lama terhapus dari Storage setelah diganti/dihapus; cek `/guru` hanya menampilkan profil terbit.


## 2026-11-24 — Implementasi CMS Jurusan
- Pengguna mengonfirmasi seluruh tes setelah CMS Guru hijau: `pnpm typecheck`, `pnpm lint`, dan `pnpm test`. Konfirmasi berasal dari pengguna; asisten tidak menjalankan tes secara independen.
- Audit skema memastikan tabel `departments` sudah tersedia pada migrasi fondasi `20261124100000_public_content_foundation.sql`, dengan kolom `name`, `slug`, `description`, `image_path`, `sort_order`, dan `is_published`. Halaman publik `/jurusan` dan query `getPublicDepartments` juga sudah tersedia; tidak membuat tabel baru atau mengubah query publik.
- Menambahkan schema Zod `src/features/content/department-schema.ts` dan unit test `tests/unit/department-schema.test.ts`.
- Menambahkan Server Actions `department-actions.ts` untuk create/update/delete dengan pemeriksaan sesi dan permission server-side (`departments:create/update/delete/publish`), validasi data, validasi signature/MIME/ukuran gambar melalui `validateUpload`, object path acak pada bucket `media`, pembersihan gambar lama/upload yang gagal, activity log, dan revalidasi `/jurusan`, `/guru`, serta route admin terkait.
- Menambahkan editor jurusan dengan nama, slug, deskripsi, gambar terkompresi otomatis, urutan tampil, dan kontrol publikasi; menambahkan halaman admin daftar/tambah/edit serta konfirmasi penghapusan.
- Mengaktifkan menu `/admin/jurusan` setelah route tersedia; menu tetap dibatasi permission `departments:view`.
- Audit RLS menemukan policy awal departments insert/update hanya memerlukan permission create/update dan belum mensyaratkan permission publish pada row yang tampil. Migrasi baru `20261124220000_department_publication_storage_guard.sql` mendaftarkan `departments:publish`, memperketat policy insert/update agar draft dapat dikelola editor tetapi row published hanya dapat diubah publisher, serta menambahkan `departments:delete` ke helper Storage `can_manage_media()` untuk pembersihan gambar.
- Commit: schema `253c2626ccdc4a5c8dc586c7917f20b2f47fc610`; unit test `9860e9a0d4312be50435a3a99805148fc87c8b81`; actions `0b1fa66a991b27f1f98db73eed2230207ce4944d`; delete form `e81119cafdf799264f80c71bc6e023a3263c1744`; editor `60fd3f210f27f2642a11419bb9c03169f611dadc`; daftar `d3d9da4907e5598cca114a03426ce5c47e526298`; tambah `7dcc848491223256d2bd4e3a0ffb28904f7e2dc4`; edit `b99b2183a6301eba6c194f3af13bcab0745b39fe`; migrasi `5d2e9bcfb15c67d2951ab35a9c0c78b0cc05c41d`; navigasi diperbarui setelahnya.
- Status pengujian CMS Jurusan: belum dijalankan setelah implementasi. Pengguna perlu `git pull origin main`, lalu `pnpm typecheck`, `pnpm lint`, dan `pnpm test`. Asisten tidak menjalankan tes secara independen.
- Status migrasi: `20261124220000_department_publication_storage_guard.sql` baru ditambahkan dan belum dikonfirmasi diterapkan ke Supabase production. Sebelum push, tinjau dry-run dan pastikan hanya migrasi yang diharapkan pending; setelah push, verifikasi dengan `pnpm dlx supabase migration list --remote`.
- Status migrasi CMS Guru `20261124210000_teacher_publication_storage_guard.sql`: belum ada konfirmasi eksplisit pada percakapan ini bahwa migrasi sudah diterapkan ke production. Jangan menganggap hasil tes kode membuktikan migrasi database telah diterapkan.
- Tindak lanjut: jalankan pemeriksaan otomatis CMS Jurusan, tinjau dry-run migrasi Guru dan Jurusan secara berurutan, lalu uji CRUD, upload gambar valid/invalid, publikasi draft/published, serta RLS/Storage dengan akun yang memiliki dan tidak memiliki permission terkait.


## 2026-11-24 — Implementasi CMS Fasilitas Sekolah

- Pengguna mengonfirmasi seluruh pemeriksaan CMS Jurusan (pnpm typecheck, pnpm lint, pnpm test) hijau. Konfirmasi ini mendahului implementasi Fasilitas; pemeriksaan setelah perubahan Fasilitas belum dilakukan.
- Audit struktur branch main: belum ada tabel facilities, query publik fasilitas, halaman publik /fasilitas, atau route admin fasilitas. Menu fasilitas sudah tercantum di konfigurasi navigasi, tetapi sebelumnya disembunyikan karena route admin belum aktif.
- Menambahkan migrasi baru 20261124230000_public_facilities.sql: tabel fasilitas dengan nama/slug, jenis (gedung, ruang, laboratorium, olahraga, ibadah, lainnya), deskripsi, lokasi, kapasitas opsional, foto, urutan, status publikasi, timestamp, indeks dan trigger. RLS membatasi pembacaan publik pada data terbit; create/update/delete dan publikasi memerlukan permission masing-masing.
- Migrasi mendaftarkan permission facilities:view/create/update/delete/publish dan memperbarui can_manage_media() agar penghapusan foto fasilitas di bucket media dapat dilakukan oleh pemegang permission fasilitas yang sesuai. Migrasi ini belum diterapkan ke production.
- Menambahkan schema Zod dan unit test fasilitas; Server Actions create/update/delete memeriksa sesi dan permission di server, validasi file melalui validateUpload, object path acak, pembersihan foto lama/upload gagal, activity log, serta revalidasi route.
- Menambahkan editor fasilitas dengan kompresi gambar client-side melalui komponen bersama CompressedImageInput; validasi server tetap aktif. Field meliputi jenis, lokasi, kapasitas, deskripsi, urutan, foto, dan publikasi.
- Menambahkan halaman admin daftar/tambah/edit dan konfirmasi hapus pada /admin/fasilitas; mengaktifkan menu admin dan tautan navigasi publik /fasilitas. Komponen konfirmasi hapus ditandai client-side dan memakai onSubmit agar pembatalan konfirmasi menghentikan pengiriman form.
- Menambahkan query anon getPublicFacilities yang hanya membaca baris terbit, serta halaman publik fasilitas dengan kartu dan statistik jumlah per jenis yang dihitung otomatis dari data yang tampil.
- Memperbarui README agar tabel facilities dan statistik fasilitas tercatat dalam dokumentasi.
- Commit implementasi: migrasi 398abac95a70d4a8be9eae76789016c3f7cbf974; schema 43a9ebfb4612c72e049a790abe10cd2f20990eec dan penyesuaian schema f264023b17af7b697e3a2df236e2dc3a07dafdc3; test 3cd8bd1660d7ceda0d4c3857c8d3328b958804d8; actions ed3493698d367d5057ac701ec5e4a3aea4b2466f; editor 4e375355c1be55930a1f4cddd24816731a372c17; delete form 162e30f131f591a146378e16ef833820186375f7; admin list cc80cbf1383bd4c581a9bfbd608fbc72f76d0abc; create 5c74a4c474557a7e7ca187be999a9496c838132f; edit 7ae8b87a3b191c3764243e14b33e8ccfdcd7820d; public page fe03fa7c045f3e1117921076a31a49b1e939531f; public query 58029a782cc74358bff0375509c41c92f5e5fb57; admin nav 6f5e7abdee8674da62d0c4a5332cccfd74c5c720; public nav 22801b13af4e2dcc21267a51a8453eabaa3e3720; README 052dc8566889e552e8ea6fc387f95410e22ef2ef.
- Status pengujian: pengguna mengonfirmasi pnpm typecheck, pnpm lint, dan pnpm test semuanya hijau setelah menarik implementasi CMS Fasilitas (2026-11-24). Asisten tidak menjalankan tes secara independen.
- Status migrasi: 20261124230000_public_facilities.sql diterapkan ke Supabase production project nofznzznzjsvnkrmzpwx; pengguna mengonfirmasi pnpm dlx supabase db push --remote selesai dan seluruh daftar pnpm dlx supabase migration list --remote sesuai/sinkron pada 2026-11-24.
- Tindak lanjut fungsional: uji tambah/edit/hapus, upload gambar valid/invalid, draft/publish, akun tanpa facilities:publish tidak dapat mengubah baris terbit, serta statistik publik yang berubah sesuai jumlah fasilitas terbit.


## 2026-11-24 — Backup production dan penerapan CMS Fasilitas

- Dry-run pnpm dlx supabase db push --remote --dry-run pada project production nofznzznzjsvnkrmzpwx menampilkan tepat satu migrasi pending: 20261124230000_public_facilities.sql.
- Sebelum penerapan, pengguna membuat backup production melalui Supabase Session Pooler (host aws-1-ap-northeast-2.pooler.supabase.com, port 5432) menggunakan pg_dump --format=custom --no-owner --no-acl. Password tidak disimpan dalam dokumentasi.
- Arsip backup: /home/kali/db-backups/web-sekolah-20261124-before-facilities.dump; ukuran 464 KB; format CUSTOM; 654 TOC entries; database source PostgreSQL 17.12; dibuat dengan pg_dump 18.6. pg_restore --list berhasil membaca arsip.
- SHA-256 backup: ca15cc96c925a2343c822a7cf5820212b3c487d7f888303fda42b070443d7fa6.
- Pengguna mengonfirmasi pnpm dlx supabase db push --remote berhasil dan seluruh daftar pnpm dlx supabase migration list --remote sudah sesuai. Dengan demikian migrasi 20261124230000_public_facilities.sql tercatat diterapkan pada production dan sinkron Local/Remote.
- Status tes kode CMS Fasilitas: pengguna mengonfirmasi pnpm typecheck, pnpm lint, dan pnpm test semuanya hijau sebelum migrasi production.
- Belum ada konfirmasi uji fungsional langsung pada production. Tindak lanjut: uji CRUD fasilitas, upload gambar valid/invalid, pembersihan foto lama, akses draft oleh staf berizin, visibilitas publik hanya untuk fasilitas terbit, serta pembatasan publikasi oleh permission facilities:publish. Pastikan uji dilakukan dengan akun/role yang sesuai dan jangan menguji penghapusan data penting.


## 2026-11-24 — Perbaikan alur publikasi CMS Fasilitas

- Berdasarkan laporan uji browser pengguna, fasilitas berhasil disimpan tetapi tidak muncul pada halaman publik; pengguna mengonfirmasi tidak menemukan tombol publikasi.
- Audit kode menemukan halaman daftar admin hanya menyediakan Edit dan Hapus. Kontrol publikasi sebelumnya hanya berupa checkbox pada editor, dan checkbox tersebut nonaktif untuk akun tanpa permission `facilities:publish`; tidak tersedia tindakan publikasi khusus pada daftar fasilitas.
- Menambahkan Server Action `publishFacility` untuk memublikasikan fasilitas Draft yang sudah ada. Action memvalidasi UUID, sesi, permission `facilities:update` dan `facilities:publish`, status data, hasil update Supabase, activity log, serta revalidasi `/fasilitas` dan `/admin/fasilitas`. RLS tabel tetap menjadi lapisan perlindungan database; tidak ada perubahan migrasi.
- Menambahkan tombol **Publikasikan** pada baris fasilitas berstatus Draft. Tombol hanya ditampilkan bagi akun yang memiliki kedua permission yang diperlukan; fasilitas berstatus Tampil tidak menampilkan tombol tersebut.
- Commit perbaikan: Server Action `5c647401b9b781d102ecdf992c20255f2342a4e0`, UI tombol publikasi `f6be8de1731634ea3e2bae81817bf7b71bc3520d`, pemeriksaan hasil update `35c6525a727fdbaeb371147469247087795165bc`.
- **Status pemeriksaan:** belum dijalankan setelah perbaikan. Pengguna perlu menarik `main`, menjalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`, lalu menguji tombol Publikasikan dengan akun yang memiliki permission `facilities:update` dan `facilities:publish`.
- **Catatan:** akun tanpa permission publikasi memang tidak akan melihat tombol. Jika tombol tetap tidak muncul pada akun administrator, periksa assignment permission akun tersebut; jangan melemahkan pemeriksaan RBAC atau RLS sebagai jalan pintas.


## 2026-11-24 — Konfirmasi halaman publik Fasilitas dan langkah lanjutan

- Pengguna mengonfirmasi bahwa hasil pembaruan fasilitas sekarang sudah dapat dilihat pada halaman publik.
- Ini mengonfirmasi alur data fasilitas terbit ke halaman publik berfungsi pada kondisi production saat ini. Penyebab teknis/perubahan spesifik yang menyelesaikan kendala akses sebelumnya belum dikonfirmasi, sehingga catatan ini tidak mengatribusikannya pada GRANT atau perubahan policy tertentu.
- Tidak ada migrasi baru yang dibuat atau diklaim diterapkan pada sesi konfirmasi ini.
- Langkah berikutnya: audit konsistensi RLS dan Storage lintas modul (terutama izin baca publik, pemisahan draft/published, validasi upload, dan hak hapus objek), lalu verifikasi build Cloudflare/OpenNext dan pengujian browser responsif/aksesibilitas.
- Catatan status: implementasi tombol Publikasikan Fasilitas sebelumnya belum memiliki konfirmasi terpisah bahwa typecheck/lint/test dijalankan setelah commit perbaikannya. Konfirmasi tampilnya data publik bukan pengganti pemeriksaan otomatis.


## 2026-11-24 — Audit dan hardening RLS/Storage (migration disiapkan)

- Pengguna memberikan hasil audit policy production untuk tabel konten, `gallery_images`, dan `storage.objects`, serta definisi aktif fungsi `has_permission`, `has_any_permission`, `is_super_admin`, `can_manage_media`, dan `can_manage_public_docs`.
- Konfirmasi ACL terbaru: `has_permission(text)` memiliki EXECUTE untuk `anon`; definisinya memeriksa `auth.uid()`, akun aktif/tidak terhapus, dan permission. Untuk sesi anon tanpa UID, pemeriksaan permission staf menghasilkan false. Temuan error EXECUTE anon sebelumnya tidak lagi berlaku untuk keadaan ACL terbaru.
- Temuan policy: SELECT publik dan staf masih digabung pada sejumlah tabel; News, Announcements, dan Galleries memiliki celah transisi unpublish karena USING tidak mensyaratkan permission publish pada row lama; policy `gallery_images` belum mengikat mutasi pada status publikasi album; helper `can_manage_media()` menggabungkan permission banyak modul untuk seluruh folder bucket media.
- Menambahkan migration baru `20261124240000_security_rls_storage_hardening.sql` untuk memisahkan policy SELECT anon/staf pada News, kategori berita, Guru, Jurusan, Fasilitas, dan Pengumuman; mensyaratkan permission publish untuk mengubah row terbit; mengikat mutasi gambar galeri pada permission dan status publikasi album; serta mengganti policy bucket media agar permission diperiksa berdasarkan folder objek.
- Helper `can_manage_gallery_images(uuid)` hanya memeriksa keberadaan album dan izin publikasi; permission operasi tetap diperiksa terpisah di masing-masing policy (update memerlukan `galleries:update`, delete memerlukan `galleries:update` atau `galleries:delete`). Helper `can_manage_media_folder(text)` menggunakan allowlist folder yang sudah tercantum pada policy insert sebelumnya dan permission modul terkait.
- Commit migration awal: `ab92490d81789cf1f122b917e06369bdb64e1dce`; perbaikan pemisahan permission update/delete gambar galeri: `9c02a6edd8bf8ecd0ca9a21b3a396d9156df56cf`.
- **Status penting:** migration baru hanya committed ke branch `main`; belum diterapkan ke Supabase production dan belum diuji dengan dry-run. Jangan jalankan `db push` sebelum memeriksa urutan migration, membuat backup terbaru, dan meninjau SQL.
- **Status pengujian:** belum ada typecheck/lint/test/build atau pengujian RLS/Storage setelah perubahan ini. Uji wajib mencakup anon, staf tanpa permission publish, publisher, serta akun dengan permission hanya satu modul untuk memastikan tidak dapat mengelola folder media modul lain.
- **Catatan risiko tersisa:** bucket `media` tetap public. Pada Supabase public bucket, objek dapat diunduh oleh siapa pun yang mengetahui URL; policy SELECT Storage bukan kontrol kerahasiaan untuk objek public. Jangan simpan dokumen sensitif atau file draft yang harus benar-benar privat di bucket ini.
- Langkah berikutnya: tinjau SQL dan dry-run migration; verifikasi permission code yang benar-benar terdaftar (terutama `news:delete` dan `announcements:delete`); pastikan backup production terbaru tersedia; baru rencanakan penerapan dan tes regresi.


## 2026-11-24 — Verifikasi akhir sebelum penerapan hardening RLS/Storage

- Pengguna mengonfirmasi hasil query permission menunjukkan `news:delete`, `announcements:delete`, dan `galleries:publish` tersedia; dry-run Supabase dilaporkan aman.
- Pemeriksaan kode upload fasilitas memastikan object path menggunakan folder `facilities/`. Pemeriksaan migration sebelumnya menunjukkan policy insert media yang ada memakai allowlist folder tetap dan tidak mencantumkan `announcements`; untuk menghindari perluasan hak akses yang tidak diminta, cabang folder `announcements` dihapus dari helper `can_manage_media_folder(text)`. Folder lain tetap mengikuti allowlist lama.
- Migration `20261124240000_security_rls_storage_hardening.sql` diperbarui sebelum penerapan; commit penyesuaian tercatat pada GitHub setelah pemeriksaan akhir.
- **Status:** migration tetap belum diterapkan. Dry-run yang dilaporkan pengguna dilakukan sebelum penyesuaian kecil ini, sehingga wajib jalankan ulang `git pull origin main`, `pnpm dlx supabase migration list --remote`, dan `pnpm dlx supabase db push --remote --dry-run`.
- Backup production terbaru masih wajib dibuat sebelum `db push`; backup yang tersedia dibuat sebelum migration Fasilitas dan tidak mencakup keadaan database terkini.
- Setelah backup terverifikasi dan dry-run ulang hanya menampilkan migration hardening yang diharapkan, pengguna dapat menjalankan `pnpm dlx supabase db push --remote`, lalu memverifikasi `pnpm dlx supabase migration list --remote`.
- Pengujian RLS/Storage dengan anon, editor tanpa publish, publisher, serta pemegang permission lintas folder tetap menjadi tindak lanjut wajib. Belum ada klaim migration production diterapkan atau tes regresi lulus.


## 2026-11-24 — Verifikasi penerapan hardening RLS/Storage production

- Pengguna mengonfirmasi hasil `pnpm dlx supabase migration list --remote`: migration `20261124240000` tercatat sama pada Local dan Remote; dry-run dilaporkan aman. Ini menunjukkan migration sudah tercatat diterapkan pada project production `nofznzznzjsvnkrmzpwx`.
- Backup sebelum hardening dibuat di `/home/kali/db-backups/web-sekolah-20261124-before-security-hardening.dump`, ukuran 471 KB, format CUSTOM, 665 TOC entries. `pg_restore --list` berhasil membaca arsip. SHA-256: `b901c58673f1da87f0c158ba2a17d756e3bfd918b85a88ead65d2bdee4200422`.
- Pengguna mengirim verifikasi `pg_policies`: policy SELECT publik/staf terpisah pada News, kategori berita, Guru, Jurusan, Fasilitas, Pengumuman, Galeri, dan gambar galeri; policy update/insert/delete tetap ada. Policy Storage `media_insert/select/update/delete` kini memanggil `can_manage_media_folder((storage.foldername(name))[1])`.
- Pengguna mengonfirmasi kedua helper `can_manage_gallery_images(uuid)` dan `can_manage_media_folder(text)` tersedia sebagai SECURITY DEFINER dengan `search_path` kosong; EXECUTE tidak diberikan kepada anon dan tersedia untuk authenticated.
- **Batas verifikasi:** hasil `pg_policies` yang dikirim baru memuat nama, command, dan role untuk tabel publik; ekspresi `qual`/`with_check` policy tabel belum dikirim. Belum ada uji sesi anon/editor/publisher atau uji akses folder Storage lintas modul. Jangan menyatakan seluruh skenario RLS sudah lolos sebelum pengujian tersebut.
- Tindak lanjut: periksa ekspresi policy UPDATE/INSERT untuk News, Pengumuman, Galeri, dan gallery_images; lalu uji dengan JWT role/akun terpisah bahwa anon hanya membaca konten terbit, editor tanpa permission publish tidak dapat mengubah/unpublish konten terbit atau album terbit, publisher dapat melakukan aksi yang diizinkan, serta permission fasilitas tidak dapat mengelola folder media modul lain.


## 2026-11-24 — Uji awal RLS menggunakan role anon

- Pengguna menjalankan transaksi read-only dengan `SET LOCAL ROLE anon` untuk menghitung baris yang terlihat pada sembilan tabel konten.
- Hasil: `news=0`, `announcements=0`, `galleries=0`, `gallery_images=0`, `achievements=1`, `events=0`, `teachers=0`, `departments=0`, `facilities=1`.
- Tidak ada error permission/RLS yang dilaporkan. Hasil ini konsisten dengan policy SELECT yang mengizinkan role anon membaca data publik; dua modul memiliki masing-masing satu baris yang terlihat.
- **Batas bukti:** hitungan nol tidak membuktikan draft tersembunyi jika tabel memang tidak memiliki draft/row lain. Hitungan positif juga belum memeriksa kolom/status/waktu publikasi pada baris yang terlihat. Karena itu, ini merupakan smoke test anon, bukan bukti lengkap seluruh skenario RLS.
- Pemeriksaan sebelumnya telah mengonfirmasi ekspresi policy UPDATE untuk News, Announcements, Galleries, serta policy mutasi `gallery_images`: editor memerlukan permission modul, dan operasi pada konten/album terbit memerlukan permission publish.
- **Tindak lanjut audit:** lakukan pengujian terkontrol memakai sesi akun editor tanpa permission publish dan publisher; uji transisi draft/published tanpa mengubah data penting (gunakan fixture/test row bila memungkinkan). Lanjutkan pengujian Storage lintas-folder: akun dengan permission fasilitas tidak boleh mengelola folder media modul lain. Setelah itu jalankan build Cloudflare/OpenNext dan uji responsivitas/aksesibilitas.
- Tidak ada perubahan kode atau database pada langkah pengujian ini. Catatan ini hanya mendokumentasikan hasil yang dilaporkan pengguna.


## 2026-11-24 — Pengujian akun editor dan Storage lintas-folder dilaporkan selesai

- Pengguna mengonfirmasi pengujian akun editor dan permission Storage lintas-folder telah selesai dilakukan setelah smoke test anon serta pemeriksaan ekspresi policy UPDATE/`gallery_images`.
- **Batas bukti:** pesan konfirmasi belum menyertakan skenario, hasil aktual (diizinkan/ditolak), akun/role yang dipakai, atau output SQL. Karena itu dokumentasi mencatat pengujian telah dilakukan berdasarkan laporan pengguna, tetapi tidak mengklaim seluruh skenario lulus. Lengkapi hasil pass/fail bila tersedia.
- Query agregasi role/permission yang dikirim pengguna menghasilkan: `super_admin` memiliki 1 akun aktif; role `editor`, `admin_sekolah`, `guru`, `operator_ppdb`, dan `superadmin` masing-masing 0 akun aktif. Role `editor` tetap memiliki daftar permission termasuk `news:publish`, `announcements:publish`, dan `galleries:publish`, tetapi tidak ada assignment user aktif ke role tersebut pada saat query dijalankan. Jangan menyamakan daftar permission role dengan bukti bahwa akun editor aktif benar-benar memakai role itu.
- Query role hanya membaca metadata RBAC; tidak mengubah data. Untuk mengulang pengujian akun, verifikasi assignment role aktual dan hindari menambah/mengubah akun production hanya demi tes tanpa rencana dan persetujuan.
- Smoke test anon sebelumnya: `news=0`, `announcements=0`, `galleries=0`, `gallery_images=0`, `achievements=1`, `events=0`, `teachers=0`, `departments=0`, `facilities=1`. Ini hanya hitungan visibilitas, bukan pemeriksaan isi/status tiap row.
- Ekspresi policy UPDATE News/Announcements/Galleries mensyaratkan permission `:update` serta permission `:publish` untuk row terbit; mutasi `gallery_images` memakai helper `can_manage_gallery_images(gallery_id)`.
- Konfigurasi build: `package.json` menyediakan script `pnpm cf:build` = `opennextjs-cloudflare build`; konfigurasi ada pada `open-next.config.ts` dan `wrangler.jsonc`. Script `pnpm build` menjalankan `next build`, bukan build Cloudflare.
- **Langkah berikutnya:** jalankan `git pull origin main`, pastikan working tree bersih, lalu `pnpm cf:build`. Simpan output lengkap jika gagal; jangan menganggap build sukses sebelum ada hasil terminal. Setelah build berhasil, lanjutkan smoke test preview/deployment dan uji browser responsif, keyboard, label form, kontras, serta tautan navigasi.
- **Commit rujukan sebelum catatan ini:** `187b166c1128b129cb8dc248b495ff887a96eac9` (`docs: record anon RLS smoke test results`).

## 2026-11-24 — Konfirmasi build Cloudflare/OpenNext

- Pengguna mengonfirmasi perintah `pnpm cf:build` selesai tanpa error pada lingkungan Kali/Termux.
- Pengguna memeriksa direktori `.open-next/`; artefak build tersedia, termasuk `worker.js`, `assets/`, `server-functions/`, `middleware/`, `cloudflare/`, dan direktori runtime lainnya.
- Konfigurasi yang diperiksa pada branch `main`: script `cf:build` menjalankan `opennextjs-cloudflare build`; `wrangler.jsonc` menunjuk `.open-next/worker.js` sebagai entry point dan `.open-next/assets` sebagai asset binding `ASSETS`; compatibility flags mencakup `nodejs_compat` dan `global_fetch_strictly_public`.
- **Kesimpulan:** build artefak Cloudflare/OpenNext berhasil menurut output pengguna. Ini belum membuktikan Worker berhasil berjalan, ter-deploy, terhubung ke binding/environment production, atau seluruh halaman lolos browser QA.
- **Langkah berikutnya:** jalankan preview lokal Worker dengan `pnpm exec wrangler dev` setelah build. Buka URL localhost yang dicetak Wrangler dan lakukan smoke test halaman publik serta admin. Jangan jalankan `wrangler deploy` dahulu; deployment production dilakukan setelah preview, binding, dan QA diperiksa.
- Checklist browser: halaman beranda, berita, pengumuman, galeri, prestasi, agenda, guru, jurusan, fasilitas; navigasi mobile/desktop; login dan route admin; form; upload gambar; konsol browser/network; keyboard focus dan label form. Pastikan environment variable/binding yang diperlukan tersedia tanpa menyalin secret ke chat atau Git.
- **Batas pengujian:** pengguna belum melaporkan hasil `wrangler dev` atau pengujian browser. Jangan menyatakan preview/deployment/QA berhasil sebelum ada outputnya.

## 2026-11-24 — Kendala preview lokal Wrangler pada Termux/Proot

- Pengguna menjalankan `pnpm exec wrangler dev` setelah build OpenNext berhasil. Wrangler 4.166.0 membaca `.env.local` dan menampilkan binding `ASSETS`, `NEXT_PUBLIC_SUPABASE_URL`, serta `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Proses runtime lokal kemudian gagal saat memulai `ProxyWorker/InspectorProxyWorker`: TCMalloc gagal melakukan `MmapAligned()` untuk region 1 GiB dan menyatakan asumsi virtual address space 48-bit tidak terpenuhi; proses berakhir dengan fatal allocator error, lalu Wrangler melaporkan `write EPIPE`.
- Log terlampir tidak menunjukkan error aplikasi, Supabase, atau kegagalan artefak build. Kegagalan terjadi pada runtime `workerd` yang dipakai Wrangler untuk local dev. Ini konsisten dengan known limitation upstream Cloudflare workerd pada Termux/Android/PRoot dan beberapa kernel ARM64 dengan virtual address space 39-bit (lihat workerd issue #5020 dan workers-sdk issue #10878).
- Dokumentasi Cloudflare menyebut `wrangler dev --remote` sebagai mode legacy remote development: kode Worker diunggah ke preview Cloudflare dan dieksekusi di infrastruktur Cloudflare; seluruh binding menggunakan resource remote. Mode ini menghindari eksekusi workerd lokal, tetapi berarti harus memperlakukan environment/backend yang terhubung sebagai remote/berpotensi production.
- **Jangan** menganggap menaikkan RAM, mengganti versi Node, atau meng-upgrade Wrangler pasti menyelesaikan masalah; laporan upstream menunjukkan akar masalah allocator/virtual address space, bukan sekadar heap Node.
- **Jangan** memasang binary workerd pihak ketiga yang tidak cocok versinya secara langsung. Ada build komunitas tanpa TCMalloc untuk ARM64/39-bit, tetapi perlu verifikasi kecocokan versi workerd dengan Wrangler yang terpasang serta sumber binary sebelum dipakai.
- **Langkah aman berikutnya:** bila pengguna setuju memakai remote preview, jalankan `pnpm exec wrangler dev --remote` hanya setelah memahami bahwa kode dan konfigurasi akan dikirim ke Cloudflare dan semua binding akan mengarah ke resource remote. Untuk uji awal, batasi pada halaman publik/read-only; jangan login admin, submit form, upload, atau menjalankan aksi mutasi yang dapat mengubah Supabase production. Alternatif paling aman untuk QA penuh adalah preview di staging terpisah atau menjalankan local preview pada Linux desktop/server yang didukung.
- **Status:** build `pnpm cf:build` berhasil; local `wrangler dev` gagal karena kompatibilitas runtime pada lingkungan saat ini; remote preview dan browser QA belum dijalankan.
