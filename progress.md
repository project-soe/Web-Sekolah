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
