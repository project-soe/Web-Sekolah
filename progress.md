# Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Baca sebelum melanjutkan dan perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Tanggal pembaruan:** 2026-11-28.
- Browser QA happy-path undangan guru dikonfirmasi pengguna: undangan dibuat, OTP berhasil diverifikasi, dan akun berhasil masuk ke `/ruang-guru`. Edge-case undangan dan verifikasi migrasi production tetap tertunda.
- PR #17 ekspor CSV absensi bulanan sudah merged (merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`); pengguna mengonfirmasi CI hijau. Browser QA unduhan masih tertunda.
- PR #18 regression test lifecycle withdrawn sudah merged (merge commit `42b884b39db0b2c4a94ccf540edd36c1f7954d9d`); CI #393 sukses. Browser QA alur withdrawn masih tertunda.
- **Branch utama:** `main`; PR #12 (modul absensi), PR #13 (pemilihan tanggal absensi guru), PR #14 (idempotensi migrasi arsip siswa), PR #15 (pembaruan dokumentasi QA), dan PR #16 (rekap bulanan absensi), PR #17 (ekspor CSV), dan PR #18 (regression test lifecycle withdrawn) sudah merged. Merge commit PR #13: `db742ce0f6ba4b3ab546435f0826dfa40cd6c7b3`; PR #14: `01d3b0a3171c333a5c97b88cc222c6f9c511a3e5`.
- **CI:** PR #12 (run #367), PR #13 (termasuk run #371), dan PR #14 (run #370) dikonfirmasi pengguna seluruhnya hijau sebelum merge.
- **Tahap fungsional:** website publik/CMS, administrasi siswa/kelas/tahun ajaran/lifecycle, onboarding Portal Siswa, dan tahap pertama Modul Absensi Siswa. Browser QA admin pada 2026-11-28 mengonfirmasi tab Absensi tampil dan rekap harian termuat; koreksi serta lock/unlock belum diuji. Pengguna mengonfirmasi PR #16 sudah merged dan migrasi rekap bulanan sudah dideploy.
- **Portal Siswa:** pengguna mengonfirmasi simulasi pendaftaran berhasil dan akun dapat login pada 2026-11-27. Item pengujian pendaftaran Portal Siswa dihapus dari daftar deferred; cakupan konfirmasi tidak berarti seluruh edge-case sudah diuji.
- **Modul Absensi:** migrasi `20261127330000_student_daily_attendance.sql`, UI guru, rekap/koreksi admin, dan tampilan riwayat Portal Siswa sudah masuk main. Browser QA guru/admin/siswa masih tertunda.
- **Perbaikan lanjutan absensi:** pemilih tanggal guru (hari ini hingga 7 hari kalender sebelumnya), validasi server, dan retensi tanggal setelah submit/error sudah merged melalui PR #13.
- **Rancangan dan keputusan domain:** `docs/attendance-module-design.md`.
- **Daftar tertunda:** `docs/known-issues-and-deferred.md`.
- **Database production:** migrasi absensi belum diterapkan. Periksa migration list remote, review SQL, pastikan backup, dan minta persetujuan eksplisit sebelum deployment. Jangan sentuh project Supabase kedua.
- **Deployment aplikasi:** Cloudflare Workers/OpenNext (`wrangler.jsonc`).
- **Aturan kerja:** jangan mengklaim build/typecheck/test/migrasi/browser QA berhasil tanpa bukti.

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
- Backup otomatis/point-in-time dari Dashboard tidak tersedia pada paket saat ini; karena itu belum ada backup production yang terkonfirmasi.- Keenam migrasi konten sudah ditinjau dan dry-run hanya menampilkan enam file yang diharapkan. Tidak ditemukan `drop table`, `truncate`, atau penghapusan massal data, tetapi ini tidak menghilangkan risiko kegagalan SQL atau perubahan policy.
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
- Pengguna mengonfirmasi menjalankan `pnpm dlx supabase db push --remote` pada project production `Web-Sekolah` (project ref `nofznzznzjsvnkrmzpwx`). CLI menerapkan tepat satu migrasi: `20261124200000_event_publication_storage_guard.sql`; output berakhir dengan `Finished supabase db push.`- Pengguna kemudian menjalankan `pnpm dlx supabase migration list --remote`. Versi `20261124200000` tercatat sama pada kolom Local dan Remote dengan waktu UTC `2026-11-24 20:00:00`. Ini mengonfirmasi migrasi guard publikasi Agenda dan permission penghapusan media Agenda sudah tercatat diterapkan pada production.- Tidak ada migrasi lain yang tertunda pada daftar yang dibagikan: semua versi dari `20261123091127` sampai `20261124200000` tercatat sinkron Local/Remote.- Peringatan pnpm tentang native binary/build scripts, pesan melewati `.gitkeep`, dan notifikasi Supabase CLI versi baru tidak menghalangi operasi; push dan pembacaan daftar migrasi selesai tanpa error.
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

## 2026-11-24 — Menyiapkan konfigurasi Cloudflare Worker Previews

- Pengguna mencoba `pnpm dlx wrangler@4.167.0 preview --name web-sekolah-audit`. Wrangler berhasil melewati autentikasi, tetapi menolak konfigurasi karena `wrangler.jsonc` belum memiliki blok `previews`.
- Dokumentasi Cloudflare menyatakan Worker Previews memerlukan Wrangler 4.135.0 atau lebih baru dan blok `previews` pada konfigurasi; blok boleh kosong jika tidak ada pengaturan Preview khusus.
- Menambahkan `"previews": {}` ke `wrangler.jsonc`. Pengaturan top-level produksi, entry point OpenNext, compatibility flags, dan asset binding tidak diubah.
- Status: perubahan konfigurasi sudah dicommit ke `main`; pengguna perlu menarik perubahan, lalu mencoba kembali `pnpm dlx wrangler@4.167.0 preview --name web-sekolah-audit`.
- Peringatan keamanan: Worker Preview memiliki URL publik secara default dan konfigurasi Preview tidak otomatis mewarisi variabel/secret produksi. Namun, nilai `NEXT_PUBLIC_*` dapat tertanam ke bundle ketika `pnpm cf:build` dijalankan. Build sebelumnya dilakukan saat `.env.local` memuat konfigurasi Supabase produksi; karena itu Preview harus diperlakukan sebagai terhubung ke Supabase produksi sampai dibuktikan sebaliknya. Batasi pengujian pada GET halaman publik; jangan login admin, submit form, upload, atau menjalankan Server Action yang mengubah data.
- Belum ada URL Preview atau hasil browser QA. Jangan menyatakan Preview berhasil sebelum output Wrangler dan uji browser diterima.

## 2026-11-24 — Browser QA Worker Preview (laporan pengguna)

- Pengguna membuka Worker Preview `https://web-sekolah-audit-web-sekolah.soegenglz7.workers.dev` dan melaporkan halaman-halaman yang sudah tersedia dapat dibuka dengan normal, tanpa error.
- Pengguna juga menguji tautan/route PPDB/SPMB dan Siswa; keduanya masih menampilkan halaman tidak ditemukan (404).
- Ini bukan kegagalan runtime Preview berdasarkan laporan yang tersedia. Audit struktur sebelumnya memang mencatat navigasi publik Siswa dan PPDB/SPMB belum memiliki route/implementasi halaman.
- **Status QA:** smoke test browser untuk halaman publik yang sudah diimplementasikan dilaporkan aman oleh pengguna. Route PPDB/SPMB dan Siswa belum lulus QA karena belum dibuat. Tidak ada klaim pengujian admin, form, upload, atau operasi tulis.
- **Tindak lanjut:** rancang dan implementasikan modul Siswa serta PPDB/SPMB secara terpisah; tentukan terlebih dahulu kebutuhan data, alur pendaftaran, akses orang tua/calon siswa, role/permission, dan kebijakan privasi sebelum menambah tabel, route, atau form. Setelah implementasi, jalankan typecheck/lint/test/build dan QA pada environment staging yang aman.


## 2026-11-24 — Awal implementasi Modul Siswa

### Keputusan arsitektur
- Modul Siswa adalah sistem internal sekolah; data induk dan data pribadi siswa tidak ditampilkan di website publik.
- Rencana bertahap: database dan keamanan → Admin Siswa (CRUD/pencarian) → pengelolaan kelas/tahun ajaran → Portal Siswa → integrasi PPDB/SPMB.
- Calon siswa PPDB tetap berada pada domain pendaftaran; hanya pendaftar yang diterima dan menyelesaikan daftar ulang yang dikonversi menjadi data induk siswa.
- Penghapusan bukan alur operasional utama. Status `graduated`, `transferred`, dan `withdrawn` dipakai untuk mempertahankan riwayat.

### Perubahan yang sudah di-commit- `supabase/migrations/20261124250000_students_foundation.sql` (awal: `89cb2278bae75187ad3d02d05751b91761924080`; perbaikan: `4fc518b75ad2ee77acada41826cbbaeaf7beb2a6`):
  - Membuat tabel privat `students` dengan NIS, NISN opsional, nama, jenis kelamin, tempat/tanggal lahir, alamat, wali, kontak wali, jurusan, tahun masuk, status, tanggal lulus, dan catatan.
  - Menambahkan indeks pencarian nama, status, jurusan, dan tahun masuk.
  - Membuat `student_status_history`; trigger otomatis mencatat status awal dan setiap perubahan status, termasuk user yang melakukan perubahan.
  - Review SQL lanjutan menghapus CHECK berbasis `current_date` (fungsi non-immutable untuk CHECK PostgreSQL) dan grant sequence yang tidak diperlukan oleh pengguna aplikasi.
  - Mengaktifkan RLS. Tidak ada policy untuk `anon`; akses authenticated mensyaratkan permission `students:view/create/update/delete`.
  - Permission dasar `students:* ` sudah didefinisikan oleh migrasi RBAC fondasi; role `admin_sekolah` sudah mendapat permission modul students.
- `src/app/admin/siswa/page.tsx` (commit `9d9c9b0047ec0ebdb3c616b3b7c781b4e7220620`):
  - Menambahkan halaman daftar siswa yang memanggil `requirePermission("students:view")`.
  - Menampilkan data minimum yang dibutuhkan pada daftar; tidak menampilkan alamat, tanggal lahir, atau kontak wali.
  - Menyediakan empty/error state. Form tambah/edit dan pencarian belum dibuat.
- `src/components/layout/admin/admin-nav.tsx` (commit `b4eaa9e8ac2d6e27843005e488599206a3fcb3ca`):
  - Mengaktifkan menu Siswa hanya untuk route yang sudah tersedia dan akun dengan permission `students:view`.

### Status dan batas verifikasi
- Ketiga perubahan di atas sudah tersimpan di branch `main`.
- Migrasi `20261124250000_students_foundation.sql` **belum diterapkan ke Supabase**. Jangan menganggap route daftar sudah dapat membaca tabel sebelum migrasi diterapkan.
- Typecheck, lint, test, build, dan pengujian RLS khusus Modul Siswa belum dijalankan/dikonfirmasi setelah perubahan ini.
- Belum ada formulir CRUD, pencarian/filter, halaman detail/riwayat, atau integrasi kelas/tahun ajaran.
- Data siswa tidak ditambahkan ke `publicNav` dan tidak dibuat route publik.

### Langkah berikutnya
1. Tinjau dan terapkan migrasi siswa pada target Supabase yang benar setelah backup dan pemeriksaan migration list.
2. Jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`; perbaiki semua error.
3. Implementasikan schema Zod, server actions dengan pemeriksaan permission, create/edit form, detail siswa, pencarian/filter, serta activity log.
4. Uji RLS menggunakan anon dan akun dengan permission berbeda; pastikan anon tidak dapat membaca atau menulis data siswa.
5. Setelah Admin Siswa stabil, lanjutkan Portal Siswa dan integrasi PPDB/SPMB.

### Catatan konsistensi dokumentasi
- Bagian status lama di atas masih memuat sejumlah catatan migrasi dan tahapan yang sudah kedaluwarsa/bertentangan dengan perkembangan berikutnya. Untuk pekerjaan Modul Siswa, gunakan catatan bertanggal terbaru dan verifikasi commit/migration list aktual sebelum menyimpulkan status production.


## 2026-11-24 — Admin Siswa: CRUD aman, pencarian, detail, dan riwayat

- Sebelum perubahan ini, pengguna mengonfirmasi pnpm typecheck, pnpm lint, pnpm test, dan pnpm build selesai tanpa error.
- Pengguna mengirim migration list --remote: seluruh 20 versi Local/Remote sinkron, termasuk 20261124250000_students_foundation.sql pada production project nofznzznzjsvnkrmzpwx.
- Menambahkan validasi Zod untuk NIS, NISN 10 digit, nama, jenis kelamin, tanggal kalender, kontak wali, jurusan, tahun masuk, status, dan tanggal lulus.
- Menambahkan server action create/update dengan validasi server, pemeriksaan sesi dan permission students:create/students:update, Supabase server client dengan RLS tetap aktif, activity log tanpa data pribadi, dan revalidasi route.
- Menambahkan formulir tambah/edit serta route /admin/siswa/tambah dan /admin/siswa/[id]/edit.
- Memperbarui /admin/siswa dengan pencarian nama/NIS/NISN dan filter status. Daftar hanya menampilkan kolom minimum.
- Menambahkan /admin/siswa/[id] untuk detail privat dan 50 riwayat status terakhir. Riwayat dibuat otomatis oleh trigger database.
- Tidak menambahkan operasi hapus permanen; status lulus/pindah/keluar mempertahankan rekam jejak. Tidak ada direktori siswa publik.

### Batas verifikasi
- Kode pada commit ini belum diuji setelah perubahan oleh asisten. Hasil empat pemeriksaan yang dikonfirmasi pengguna berlaku untuk kode sebelum perubahan ini.
- Jalankan ulang pnpm typecheck, pnpm lint, pnpm test, dan pnpm build.
- Uji integrasi: anon tidak dapat membaca students; akun tanpa permission ditolak; students:view dapat membaca daftar/detail/riwayat; students:create dapat membuat siswa; students:update dapat mengubah data dan memicu student_status_history.
- Tes unit baru: tests/unit/student-schema.test.ts. Uji mutasi dengan fixture/staging, bukan data nyata production.

### Langkah berikutnya
1. Tarik commit ke Kali dengan git pull origin main, lalu jalankan ulang empat pemeriksaan.
2. QA di environment aman: daftar, pencarian, filter, tambah data dummy, edit, dan riwayat status.
3. Verifikasi RLS memakai anon dan akun/role dengan permission berbeda. Migration list bukan bukti RLS lulus.
4. Setelah Admin Siswa lolos, rancang pengelolaan kelas/tahun ajaran sebelum Portal Siswa dan integrasi PPDB/SPMB.

### Catatan status terbaru yang mengesampingkan catatan lama
- Migration 20261124250000_students_foundation.sql telah dikonfirmasi tercatat sama pada Local dan Remote pada 2026-11-24; catatan lama yang menyebutnya belum diterapkan sudah kedaluwarsa.
- Typecheck/lint/test/build dilaporkan lolos sebelum implementasi Admin Siswa pada commit ini; belum ada klaim pemeriksaan setelah perubahan ini.


## 2026-11-24 — Perbaikan typecheck Admin Siswa

- Audit log GitHub Actions run 45376947319 pada commit 4a0107045775d675eed6043b829ebea770018d9e menemukan satu kegagalan pada `pnpm typecheck`, tepatnya `src/features/students/student-actions.ts(38,46)`.
- Akar masalah: object payload dibuat sebagai union antara varian `created_by` dan `updated_by`, lalu union itu dipakai untuk operasi Supabase update/insert. Inferensi tipe Supabase menolak varian insert saat memeriksa update.
- Perbaikan: pisahkan object payload umum, lalu tambahkan `updated_by` hanya pada pemanggilan `update()` dan `created_by` hanya pada pemanggilan `insert()`. Tidak mengubah skema database maupun perilaku permission/RLS.
- Pada run tersebut, instalasi dependency dan lint selesai; test/build dilewati karena typecheck gagal. Dua warning lint pada halaman agenda bukan error dan tidak menyebabkan CI gagal.
- Perbaikan ini belum diverifikasi oleh typecheck lokal; verifikasi berikutnya melalui GitHub Actions dan perintah lokal pengguna.


## 2026-11-24 — Fondasi Tahun Ajaran, Kelas, dan Penempatan Siswa

- Mengikuti keputusan pengguna, format nama rombongan belajar menggunakan contoh `X TKJ 1`. Nama kelas disimpan sebagai label yang dapat dibaca; tingkat (X/XI/XII), jurusan, wali kelas, dan tahun ajaran disimpan sebagai relasi terstruktur.
- Menambahkan migrasi baru `20261124260000_academic_years_and_class_groups.sql`: tabel `academic_years`, `class_groups`, `student_class_enrollments`, dan `student_class_history`.
- Satu tahun ajaran aktif dijamin oleh unique partial index. Kelas terikat pada satu tahun ajaran; siswa hanya memiliki satu penempatan per tahun ajaran.
- Trigger database memvalidasi bahwa kelas dan tahun ajaran cocok, serta hanya siswa berstatus aktif yang dapat ditempatkan. Trigger riwayat mencatat penempatan awal dan perpindahan kelas.
- RLS dan grant membatasi data kelas untuk permission `classes:view/create/update/delete`; penempatan dan riwayat memerlukan kombinasi `classes:view` dan `students:view`, sedangkan perubahan penempatan memerlukan `classes:update` dan `students:update`. Tidak ada akses anon.
- Menambahkan halaman privat `/admin/kelas` untuk membuat/mengaktifkan tahun ajaran, membuat rombongan belajar, melihat daftar kelas, dan menempatkan/memindahkan siswa pada tahun ajaran aktif.
- Menambahkan server actions dengan validasi Zod, pemeriksaan permission, activity log, dan revalidasi. Menu Kelas ditampilkan hanya jika route tersedia dan akun memiliki `classes:view`.
- Tidak mengubah migrasi lama dan tidak membuat direktori siswa publik.
- **Status migrasi:** file baru belum diterapkan ke Supabase. Jangan gunakan fitur kelas/penempatan sebelum migration list remote menunjukkan versi ini telah diterapkan.
- **Status verifikasi:** perubahan kode belum dijalankan pada environment lokal. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm build`; audit SQL dan uji RLS pada staging sebelum penerapan production.
- **Catatan batasan awal:** UI tahap pertama menyediakan pembuatan tahun ajaran/kelas dan penempatan siswa; edit/hapus kelas, pengelolaan kapasitas, kenaikan kelas massal, serta laporan wali kelas belum termasuk tahap ini.


## 2026-11-24 — Perbaikan CI awal modul Kelas

- GitHub Actions run `45379534402` pada commit `d1ec83f6785a941b13e170183df2209f16614120` berhasil pada instalasi dependency dan lint, tetapi typecheck gagal.
- Penyebab: nilai action activity log `activate`, `assign_class`, dan `transfer_class` belum termasuk union `ActivityAction`. Ada juga tiga variabel sesi yang tidak dipakai pada server actions.
- Perbaikan: gunakan action yang sudah didukung (`update`, `create`, `status_change`) dan hapus variabel sesi yang tidak diperlukan. Pemeriksaan CI ulang menunggu.


## 2026-11-24 — Audit statis migrasi Siswa dan Kelas (pra-production)

### Ruang lingkup
- Membaca README, status progress terbaru, daftar migrasi pada `main`, serta migrasi fondasi siswa, penguatan RLS/Storage, dan tahun ajaran/rombongan belajar.
- Memeriksa server action penempatan siswa untuk membandingkan validasi aplikasi dengan perlindungan di database.
- Tidak menjalankan SQL terhadap Supabase production, tidak menjalankan `db push`, dan tidak mengubah data production.

### Temuan audit
- Migrasi `20261124250000_students_foundation.sql` membuat data siswa privat: tidak ada policy untuk role `anon`; akses authenticated dibatasi permission RBAC. Riwayat status ditulis oleh trigger dan hanya diberikan hak baca kepada authenticated.
- Migrasi `20261124260000_academic_years_and_class_groups.sql` membuat tahun ajaran, rombongan belajar, penempatan siswa, dan riwayat kelas. RLS membatasi akses; constraint unik mencegah lebih dari satu tahun ajaran aktif dan lebih dari satu penempatan siswa pada tahun ajaran yang sama.
- **Temuan yang diperbaiki dengan migrasi baru:** trigger penempatan sebelumnya menerima nilai `assigned_by` dari klien bila kolom itu diisi. Selain itu, policy UPDATE berbasis baris tidak membatasi perubahan kolom identitas penempatan. Server action saat ini hanya mengubah kelas, tetapi akses PostgREST langsung dengan permission yang sama dapat mencoba mengubah `student_id`, `academic_year_id`, atau metadata penempatan.
- Menambahkan `20261124270000_student_class_enrollment_audit_guard.sql`: actor `assigned_by` selalu diambil dari `auth.uid()`; perubahan `student_id`, `academic_year_id`, `assigned_at`, atau `assigned_by` saat UPDATE ditolak; `updated_by` ditetapkan database dari `auth.uid()`. Validasi kecocokan kelas/tahun ajaran dan status siswa aktif tetap dipertahankan.
- Migrasi baru menggunakan `CREATE OR REPLACE FUNCTION`; migrasi lama tidak diedit.

### Status verifikasi dan batasan
- Ini adalah **review statis kode SQL**, bukan hasil eksekusi PostgreSQL. Belum ada klaim bahwa migrasi baru lolos pada database lokal/staging.
- Belum ada bukti status penerapan migrasi `20261124260000` dan `20261124270000` pada remote terbaru dalam sesi ini. Jangan menerapkan keduanya ke production sebelum backup, pemeriksaan migration list, dan uji pada database lokal/staging.
- Pemeriksaan CI untuk commit terbaru tidak dapat dipastikan dari hasil endpoint workflow yang tersedia pada sesi audit ini. Jangan menyatakan CI terbaru hijau tanpa membuka run yang sesuai.
- Perlu pengujian negatif: anon tidak dapat membaca tabel privat; authenticated tanpa permission ditolak; pengguna berizin tidak dapat memalsukan `assigned_by` atau mengubah identitas penempatan; transfer kelas yang sah tetap menghasilkan riwayat; kelas dan tahun ajaran yang tidak cocok ditolak.
- Aktivasi tahun ajaran pada server action saat ini dilakukan melalui dua request UPDATE terpisah (non-atomik). Ini perlu ditangani pada audit lanjutan, idealnya dengan operasi database transaksional agar kegagalan request kedua tidak meninggalkan kondisi tanpa tahun ajaran aktif.

### Langkah berikutnya
1. Tarik commit terbaru dari `main`.
2. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build`.
3. Audit dan uji migrasi `20261124270000` pada database lokal/staging yang terpisah dari production; sertakan uji RLS dan trigger di atas.
4. Audit atomisitas aktivasi tahun ajaran dan konsistensi relasi kelas/penempatan.
5. Hanya setelah semua bukti uji dan backup tersedia, rencanakan penerapan production secara terpisah.


## 2026-11-24 — Aktivasi tahun ajaran atomik (pra-production)

### Perubahan
- Menambahkan migrasi `20261124280000_atomic_academic_year_activation.sql` yang menyediakan RPC `public.activate_academic_year(uuid)`.
- Fungsi berjalan sebagai `SECURITY INVOKER`, memeriksa permission `classes:update`, dan tetap tunduk pada grants serta RLS pemanggil.
- Perubahan tahun aktif dilakukan dalam satu transaksi PostgreSQL: menonaktifkan tahun aktif sebelumnya lalu mengaktifkan target. Jika target tidak ditemukan/tidak dapat diakses atau operasi gagal, seluruh transaksi dibatalkan.
- Advisory transaction lock digunakan untuk menyerialkan permintaan aktivasi bersamaan dan mengurangi benturan dengan unique partial index satu tahun aktif.
- Server action `activateAcademicYear` sekarang memanggil RPC tersebut, bukan dua request UPDATE terpisah.
- Migrasi lama tidak diedit.

### Status dan pengujian
- Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` lolos **sebelum** perubahan aktivasi atomik ini.
- Perubahan kode dan migrasi baru belum diuji ulang setelah commit. Wajib jalankan keempat pemeriksaan tersebut setelah pull.
- Belum ada pengujian PostgreSQL lokal/staging untuk RPC, rollback, permission, RLS, dan dua aktivasi bersamaan.
- Tidak ada perintah database yang dijalankan; production tidak disentuh. Jangan jalankan `db push` ke production pada tahap ini.

### Langkah pengujian berikutnya
1. Pull branch `main`.
2. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build`.
3. Pada database lokal/staging terpisah, uji aktivasi normal, target tidak ada (harus rollback dan tahun aktif lama tetap aktif), role tanpa `classes:update` (harus ditolak), serta dua aktivasi bersamaan (harus berakhir dengan tepat satu tahun aktif).
4. Periksa `pnpm dlx supabase migration list --local` hanya jika local Supabase tersedia; jangan menghubungkan atau menerapkan ke production.
5. Setelah bukti uji tersedia, lanjutkan audit relasi dan kebijakan RLS sebelum merencanakan deployment database.


## 2026-11-25 — Validasi kode aktivasi tahun ajaran atomik

- Pengguna mengonfirmasi setelah menarik perubahan aktivasi tahun ajaran atomik bahwa `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` semuanya lolos.
- Konfirmasi ini berlaku untuk kode server action RPC dan migrasi `20261124280000_atomic_academic_year_activation.sql`; hasil tes dicatat sebagai konfirmasi pengguna, bukan eksekusi independen oleh asisten.
- Pengujian PostgreSQL lokal/staging masih belum dilakukan: migrasi 2700 dan 2800, RLS, trigger audit penempatan, rollback RPC, penolakan permission, serta aktivasi bersamaan.
- Production tidak disentuh pada sesi ini. Jangan jalankan `db push --remote` atau SQL Editor production.
- Langkah berikutnya: pastikan Supabase local berjalan pada database terisolasi, lalu periksa `migration list --local` dan jalankan tes integrasi/negatif. Jika local stack tidak tersedia di perangkat, gunakan proyek staging Supabase terpisah (bukan project production).


## 2026-11-25 — Lingkungan Supabase lokal tidak tersedia

- Pengguna menjalankan pemeriksaan Docker dan `pnpm dlx supabase status` dari lingkungan Kali/Termux.
- Docker tidak tersedia; Podman juga tidak ditemukan. Supabase CLI melaporkan tidak dapat memeriksa container health karena runtime container tidak ada.
- CLI menunjukkan repository masih linked ke project `Web-Sekolah` dengan ref `nofznzznzjsvnkrmzpwx`, yaitu project production. Perintah status tersebut tidak menjalankan migrasi atau SQL dan tidak mengubah database.
- Karena local Supabase tidak dapat dijalankan pada lingkungan ini, rencana pengujian database dialihkan ke proyek Supabase staging terpisah. Jangan menjalankan `db push`, SQL Editor, atau tes tulis terhadap project production.
- Langkah berikutnya: buat project staging baru pada organisasi yang sesuai, jangan menyalin data pribadi production, lalu link CLI ke project ref staging sebelum memeriksa migration list atau menerapkan migrasi uji.

## 2026-11-25 — Audit migrasi Siswa dan Kelas tanpa staging tambahan

- Pengguna mengonfirmasi kedua slot project Supabase Free telah digunakan: satu untuk Website Sekolah dan satu untuk website lain. Project kedua tidak boleh dipakai sebagai staging dan tidak boleh disentuh.
- Karena Docker/Podman tidak tersedia di lingkungan Kali/Termux dan tidak ada slot project Supabase staging, audit dilanjutkan secara statis dari file migrasi di branch `main`. Tidak ada SQL yang dijalankan dan tidak ada koneksi/tindakan tulis terhadap project production.
- Membaca ulang `README.md`, bagian terbaru `progress.md`, serta migrasi `20261124250000_students_foundation.sql` sampai `20261124280000_atomic_academic_year_activation.sql`.
- Pemeriksaan statis: migrasi 2500 menjaga tabel siswa dan riwayat status di balik RLS authenticated/RBAC; migrasi 2600 membatasi akses tahun ajaran/kelas/penempatan dan memakai constraint unik untuk satu tahun aktif serta satu penempatan per siswa/tahun; migrasi 2700 memperbaiki kepercayaan pada metadata actor dan mengunci identitas awal penempatan; migrasi 2800 memindahkan aktivasi tahun ajaran ke satu transaksi, memeriksa permission, mempertahankan RLS melalui SECURITY INVOKER, dan memakai advisory transaction lock.
- Tidak ditemukan perintah penghapusan tabel/data massal pada empat migrasi yang ditinjau. Ini bukan bukti migrasi dapat dieksekusi atau seluruh perilaku database benar; pengujian PostgreSQL tetap belum tersedia.
- Butir audit lanjutan: verifikasi dependensi extension `pg_trgm`/operator class `extensions.gin_trgm_ops` pada migrasi fondasi; uji hak akses fungsi `has_permission` dan grants tabel; uji RLS anon/tanpa permission; uji trigger status dan riwayat kelas; uji rollback RPC untuk target tidak ada; serta uji dua aktivasi bersamaan. Perlu fixture PostgreSQL terisolasi yang dapat dijalankan di GitHub Actions tanpa menggunakan project Supabase kedua.
- Status migrasi 2600, 2700, dan 2800 pada production tidak dikonfirmasi ulang dalam sesi ini. Jangan menjalankan `db push`, SQL Editor, atau tes mutasi ke production.
- Konfirmasi pengguna sebelumnya tetap berlaku: `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` hijau untuk kode saat itu. Tidak ada tes PostgreSQL yang diklaim lulus.
- Langkah berikutnya: siapkan test harness PostgreSQL sementara berbasis GitHub Actions dengan skema/fungsi Supabase minimum yang eksplisit, lalu jalankan migrasi dan tes negatif/positif di runner terisolasi. Jangan menggunakan project Supabase kedua.

## 2026-11-25 — PostgreSQL migration test harness di GitHub Actions

- Menambahkan job CI `database-tests` dengan service PostgreSQL 17 sementara di runner GitHub Actions. Job ini tidak menggunakan secret, URL, kredensial, atau project Supabase mana pun.
- Menambahkan fixture minimum yang eksplisit untuk role `anon`, `authenticated`, `service_role`, schema `auth` dan `extensions`, `auth.uid()`, `has_permission()`, serta tabel referensi `users`, `departments`, dan `teachers`. Permission helper hanya simulasi untuk tes RLS pada database disposable, bukan pengganti implementasi RBAC produksi.
- Job menjalankan migrasi `20261124250000` sampai `20261124280000` secara berurutan, lalu menguji: extension/operator class `pg_trgm`; grant SELECT dan RLS siswa tanpa permission; pencatatan riwayat status; pemaksaan `assigned_by = auth.uid()`; riwayat penempatan/perpindahan kelas; penolakan siswa nonaktif dan kelas lintas tahun; perlindungan identitas/metadata penempatan; aktivasi tahun ajaran; rollback saat target tidak ditemukan; dan penolakan aktivasi tanpa `classes:update`.
- Menambahkan tes konkurensi dua sesi PostgreSQL yang bersaing mengaktifkan tahun ajaran berbeda; invariant yang diperiksa adalah tepat satu tahun aktif dan hasil akhir sesuai urutan lock.
- Tes berjalan hanya di service PostgreSQL ephemeral GitHub Actions dengan data dummy deterministik. Tidak ada perintah yang diarahkan ke Supabase production atau project Supabase kedua.
- Status: workflow dan skrip baru telah dikomit; hasil eksekusi GitHub Actions masih menunggu. Jangan menyatakan tes database lulus sebelum job `database-tests` benar-benar hijau.
- Catatan cakupan: fixture menguji empat migrasi siswa/kelas terbaru, bukan seluruh rangkaian migrasi aplikasi dan bukan replika penuh Supabase Auth/Storage. Jika job menemukan perbedaan kompatibilitas, perbaiki fixture/test berdasarkan log sebelum mengubah migrasi produksi.
- Review awal harness menemukan dan memperbaiki nama variabel PL/pgSQL yang berpotensi ambigu pada assertion riwayat kelas sebelum hasil CI dinilai.
- Perbaikan lanjutan harness: seluruh referensi ID penempatan pada assertion PL/pgSQL diselaraskan ke variabel lokal `v_enrollment_id`.

## 2026-11-25 — Perbaikan CI #244: permission pada tes konkurensi

- CI run #244 (`45503812792`) menunjukkan job `check` lulus seluruh tahap (lint, typecheck, test, build), dan seluruh assertion migrasi database lulus.
- Kegagalan terbatas pada `tests/database/concurrency.sh`: kedua sesi tes hanya diberi `classes:update`, padahal RPC `activate_academic_year` menargetkan baris `academic_years` yang tetap dilindungi policy SELECT `classes:view`.
- Memperbaiki kedua sesi tes agar menggunakan permission `classes:view,classes:update`. Tidak mengubah migrasi atau kode aplikasi; hanya memperbaiki konteks permission pada fixture pengujian agar sesuai dengan RLS.
- Belum mengklaim CI hijau; workflow baru harus menyelesaikan ulang job `database-tests` dan `check`.
- Perubahan hanya pada skrip tes dan dokumentasi. Tidak ada koneksi atau perubahan pada Supabase production maupun project Supabase kedua.

## 2026-11-25 — CI #245 hijau dan detail rombongan belajar

- GitHub Actions run #245 (`45504395360`) pada commit `5acd253aaa8863b9a5e2e50c31e64e8ec5c06f01` selesai dengan conclusion `success` untuk kedua job: `check` dan `database-tests`.
- Job `check`: dependency install, lint, typecheck, unit test, dan build berhasil.
- Job `database-tests`: bootstrap PostgreSQL 17 disposable, penerapan migrasi `20261124250000`–`20261124280000`, seluruh assertion database, dan tes konkurensi aktivasi tahun ajaran berhasil.
- Hasil ini membuktikan migrasi tersebut lolos pada fixture PostgreSQL terisolasi di CI; bukan bukti migrasi sudah diterapkan pada Supabase production. Fixture permission `has_permission()` tetap simulasi dan bukan replika penuh RBAC Supabase.
- Menambahkan halaman detail rombongan belajar `/admin/kelas/[id]`. Dari daftar kelas, nama kelas dapat dibuka untuk melihat tingkat, jurusan, wali kelas, tahun ajaran, serta roster siswa bila akun juga memiliki `students:view`.
- Halaman detail hanya membaca data; tidak menambah/mengubah data siswa atau kelas. Validasi ID, `classes:view`, dan pembatasan roster dengan `students:view` tetap diterapkan.
- Tidak ada migrasi database baru dan tidak ada koneksi/perubahan ke Supabase production maupun project Supabase kedua.
- Status verifikasi fitur detail: menunggu CI baru setelah commit. Pengujian browser/preview Worker belum dilakukan.
- Langkah berikutnya: tunggu CI perubahan detail kelas; setelah hijau, pengguna pull `main` dan verifikasi halaman `/admin/kelas` serta detail kelas di preview. Pengelolaan edit/hapus kelas, kapasitas, dan kenaikan kelas massal tetap belum termasuk.


## 2026-11-25 — CI #246 dan review tampilan detail kelas

- GitHub Actions run #246 (`45517565078`) pada commit `14c55c1357a39c6e09e707e8734c947863b8ffa8` selesai dengan conclusion `success`.
- Job `check` berhasil pada dependency install, lint, typecheck, unit test, dan build.
- Job `database-tests` berhasil pada bootstrap PostgreSQL disposable, penerapan migrasi `20261124250000`–`20261124280000`, seluruh assertion, serta tes konkurensi aktivasi tahun ajaran.
- Review statis halaman `/admin/kelas` dan `/admin/kelas/[id]`: tautan nama kelas menuju detail; detail menampilkan tingkat, jurusan, wali kelas, tahun ajaran/periode, dan roster; halaman dilindungi `classes:view`, sedangkan roster hanya dimuat dengan `students:view`.
- Review ini hanya inspeksi kode dan hasil CI. Tidak ada browser/preview Worker yang dijalankan, sehingga rendering aktual dan keberadaan record kelas `X TKJ 1` belum terverifikasi.
- Tidak ada perubahan kode, migrasi, atau data Supabase. Production dan project Supabase kedua tidak disentuh.
- Langkah verifikasi berikutnya: pengguna pull commit `14c55c1`, jalankan aplikasi/preview, buka `/admin/kelas`, cari kelas `X TKJ 1`, lalu buka detailnya. Uji akun dengan `classes:view + students:view` dan akun dengan `classes:view` tanpa `students:view`; kirim screenshot atau hasilnya untuk review tampilan responsif dan state kosong/permission.


## 2026-11-25 — Pemeriksaan push terbaru dan CI #247

- Pemeriksaan riwayat commit branch `main` pada 2026-11-25 menemukan head terbaru `d58ab308ae9bca5449019a0c626057b435312e4a` (`docs(progress): record CI 246 and class detail review`). Commit tersebut hanya mengubah `progress.md`; README tidak berubah.
- Pengguna mengonfirmasi CI #247 hijau. Pemeriksaan workflow run untuk commit head melalui konektor GitHub tidak mengembalikan run, sehingga status ini dicatat sebagai konfirmasi pengguna, bukan verifikasi independen; detail job/run ID belum tersedia.
- Pengguna menegaskan pada 2026-11-25 bahwa penerapan migrasi production `20261124260000`–`20261124280000` sudah selesai dan telah dipastikan 100% olehnya. Catat sebagai konfirmasi langsung pengguna; hasil verifikasi terbaru tidak ditempelkan kembali dalam percakapan, sehingga asisten tidak mengklaim telah memeriksa database secara independen. Jangan meminta pemeriksaan migrasi berulang tanpa alasan baru.
- Tidak ada perubahan kode, migrasi, konfigurasi, atau tindakan terhadap Supabase dalam pemeriksaan GitHub ini. Project Supabase kedua tidak disentuh.
- Langkah berikutnya: lanjutkan validasi fitur kelas melalui browser/preview Worker pada `/admin/kelas` dan `/admin/kelas/[id]`; periksa daftar tahun ajaran, daftar kelas, detail, roster sesuai permission, serta tampilan responsif. Setelah QA, rencanakan fitur lanjutan seperti edit/hapus kelas, kapasitas, dan kenaikan kelas massal.


## 2026-11-25 — Fitur edit rombongan belajar

- Menambahkan server action `updateClassGroup` dengan validasi Zod, pemeriksaan permission `classes:update`, verifikasi ID kelas, dan pembatasan agar tahun ajaran asal tidak dapat diganti melalui form edit.
- Perubahan yang dapat dilakukan: nama kelas, tingkat X/XI/XII, jurusan, dan wali kelas.
- Perubahan disimpan melalui Supabase dengan RLS tetap berlaku; konflik nama kelas ditangani sebagai pesan duplikat.
- Aktivitas perubahan dicatat ke activity log dan daftar/detail kelas direvalidasi.
- Menambahkan form edit pada halaman detail `/admin/kelas/[id]`; hanya akun dengan permission `classes:update` yang melihat form.
- Tidak ada migrasi database baru dan tidak ada perubahan data langsung di Supabase. Project production dan project Supabase kedua tidak disentuh oleh pekerjaan kode ini.
- Status verifikasi: perubahan belum dijalankan lokal; CI baru menunggu. Setelah CI hijau, uji edit nama/tingkat/jurusan/wali kelas, konflik nama, akun tanpa permission, dan tampilan mobile.


## 2026-11-25 — Kapasitas rombongan belajar dan pengaman penempatan siswa

- Menambahkan migrasi baru `20261124290000_class_capacity_enrollment_guard.sql`; migrasi lama tidak diubah.
- Setiap rombel memiliki kapasitas yang dapat diatur (default 36, rentang 1–60) dan counter penempatan yang dipelihara oleh trigger database.
- Penempatan baru dan perpindahan kelas memesan slot secara atomik melalui conditional UPDATE pada baris rombel. Permintaan bersamaan ke kelas yang sama diserialkan PostgreSQL sehingga kapasitas tidak dapat terlampaui.
- Trigger mengunci dua rombel secara berurutan saat transfer, mengurangi counter kelas asal setelah transfer/penghapusan, dan menolak penurunan kapasitas di bawah jumlah siswa yang sudah ditempatkan.
- Form tambah/edit rombel menerima dan menyimpan kapasitas; daftar kelas dan detail kelas menampilkan jumlah siswa dibanding kapasitas hanya bila akun memiliki permission `students:view`, sedangkan akun tanpa permission hanya melihat batas maksimum. Server action menerjemahkan penolakan kapasitas menjadi pesan yang dapat dipahami.
- Assertion tambahan memastikan counter tidak dapat dipalsukan melalui UPDATE langsung oleh klien.
- Fixture PostgreSQL disposable CI diperluas untuk menguji counter transfer, penolakan penempatan melebihi kapasitas, penolakan pengurangan kapasitas, serta dua penempatan bersamaan yang berebut satu slot.
- Tidak ada SQL yang dijalankan terhadap Supabase production dan tidak ada perubahan pada project Supabase kedua. Migrasi baru belum diterapkan ke database mana pun.
- Status verifikasi: menunggu CI untuk lint, typecheck, unit test, build, migrasi/assertion PostgreSQL, dan uji konkurensi kapasitas. Setelah CI hijau, pengguna pull commit dan uji UI tambah/edit kelas serta penempatan saat kelas penuh.


## 2026-11-25 — CI kapasitas hijau dan kenaikan kelas massal

- Pengguna mengonfirmasi seluruh pemeriksaan lokal untuk perubahan kapasitas rombel lolos.
- Verifikasi GitHub Actions: run #45529710606 pada commit 4b989dcc8f3dd421d481a799605754db8b2c424f dan run #45529628690 pada commit f01c88f45dd569d2e2c96b196daf0528e7a3e63c selesai success. Job check (lint, typecheck, unit test, build) dan database-tests (migrasi, assertion, tes konkurensi aktivasi tahun ajaran dan kapasitas) lulus.
- Menambahkan migrasi 20261124300000_bulk_class_promotion.sql untuk RPC promote_class_students, SECURITY INVOKER, pemeriksaan empat permission, validasi tahun ajaran berurutan, kelas asal X/XI dan target satu tingkat di atas, serta proses batch atomik.
- Kenaikan dilakukan per rombel: seluruh siswa berstatus aktif yang terdaftar di kelas asal dipindahkan ke kelas tujuan tahun ajaran berikutnya. Trigger kapasitas dan riwayat penempatan tetap berjalan; bila kapasitas tidak cukup, seluruh batch rollback.
- UI admin kelas menyediakan form kenaikan per kelas X/XI dan pilihan kelas tujuan pada tahun ajaran berikutnya. Kelas XII tidak dinaikkan otomatis karena harus melalui alur kelulusan terpisah.
- Assertion PostgreSQL ditambah untuk rollback saat kapasitas kurang, keberhasilan seluruh batch, riwayat, dan penolakan duplikasi. Runner memuat migrasi 3000 dan menyiapkan permission penuh pada sesi uji promosi.
- Urutan database: migrasi 20261124290000 harus diterapkan sebelum 20261124300000. Keduanya belum diterapkan ke Supabase production; jangan jalankan SQL production otomatis.
- Tidak ada perubahan atau koneksi pada project Supabase kedua.
- Status verifikasi fitur kenaikan massal: menunggu CI baru dan pengujian UI pengguna.


## 2026-11-25 — CI kenaikan kelas massal hijau

- GitHub Actions run #45533769210 pada commit `e584a3d9fb30e4d7b36b483700fa52648542bc93` selesai dengan conclusion `success`; job `check` dan `database-tests` keduanya lulus.
- Job `check` mencakup lint, typecheck, unit test, dan build. Job `database-tests` berhasil menerapkan migrasi pada PostgreSQL disposable dan menjalankan assertion, termasuk rollback batch saat kapasitas tidak cukup, promosi penuh beserta riwayat, serta penolakan promosi duplikat.
- Ini adalah verifikasi CI pada database disposable, bukan penerapan ke Supabase production. Migrasi `20261124290000_class_capacity_enrollment_guard.sql` dan `20261124300000_bulk_class_promotion.sql` tetap belum diterapkan ke production.
- Project Supabase Website Sekolah production dan project Supabase kedua tidak disentuh.
- Status fitur kenaikan kelas massal: CI hijau; menunggu pull dan uji UI oleh pengguna. Uji harus menggunakan tahun ajaran berikutnya dan kelas target yang kapasitasnya memadai; kelas XII tidak muncul sebagai kelas asal.
- Kandidat pekerjaan lanjutan setelah QA: alur kelulusan siswa kelas XII yang mengubah status siswa menjadi `graduated`, mengisi tanggal kelulusan, dan mempertahankan riwayat status. Aturan tanggal dan cakupan kelulusan perlu dipastikan sebelum implementasi.


## 2026-11-25 — Kelulusan massal siswa kelas XII

- Menambahkan migrasi baru `20261124310000_bulk_student_graduation.sql` dengan RPC `graduate_class_students` berkarakteristik SECURITY INVOKER. Fungsi memeriksa permission `classes:view`, `students:view`, `classes:update`, dan `students:update`; mengunci rombel serta tahun ajaran; hanya menerima kelas XII pada tahun ajaran aktif; lalu mengubah semua siswa aktif yang terdaftar menjadi `graduated` dan mengisi tanggal kelulusan dalam satu transaksi.
- Trigger `record_student_status_change` yang sudah ada mencatat perubahan status secara otomatis. Siswa yang bukan aktif tidak diubah. Pengulangan proses ketika tidak ada siswa aktif ditolak, dan kegagalan constraint membatalkan seluruh batch.
- Menambahkan validasi Zod dan server action yang menerapkan permission, memanggil RPC, mencatat activity log, serta merevalidasi halaman kelas dan siswa.
- Menambahkan bagian UI Kelulusan kelas XII di `/admin/kelas`, dengan daftar rombel XII pada tahun aktif, jumlah siswa aktif berdasarkan penempatan, dan input tanggal kelulusan per rombel. Bagian hanya tampil untuk akun dengan permission yang diperlukan.
- Runner database CI memuat migrasi 3100 dan assertion untuk penolakan permission, penolakan kelas non-XII, rollback penuh saat tanggal tidak valid pada salah satu siswa, kelulusan tiga siswa, penyimpanan tanggal, pencatatan tiga riwayat status, dan penolakan proses ulang.
- Migrasi 3100 belum diterapkan ke Supabase production. Urutan deployment untuk fitur kapasitas, kenaikan, dan kelulusan adalah 2900 → 3000 → 3100 setelah fondasi 2500–2800 yang sudah dikonfirmasi pengguna diterapkan. Project Supabase kedua tidak disentuh.
- Status verifikasi: menunggu GitHub Actions dan uji UI pengguna. Tidak ada klaim pengujian lokal.


### Catatan CI kelulusan — perbaikan fixture
- Run #45541329118: job `check` sukses, tetapi `database-tests` gagal saat menyiapkan fixture siswa karena test session tidak menyertakan permission `students:create`. Ini adalah kekurangan permission pada fixture CI, bukan hasil kegagalan RPC kelulusan.
- Memperbarui permission fixture untuk menyertakan `students:create` sebelum membuat tiga data calon lulusan. Commit perbaikan memicu CI ulang; status akhir belum diklaim sampai run terbaru selesai.

## 2026-11-25 — Perbaikan CI #260: delimiter blok kelulusan

- GitHub Actions run #45541600801 (CI #260) menunjukkan job `check` sukses, tetapi `database-tests` gagal saat parsing `tests/database/run.sql:349` dengan `syntax error at or near "$"`.
- Akar masalah: blok PL/pgSQL pengujian kelulusan massal memakai delimiter `do $` dan penutup `$;`, bukan pasangan dollar-quote `do $$` dan `$$;`. Memperbaiki kedua delimiter tanpa mengubah assertion atau migrasi.
- Job `check` pada run tersebut tetap sukses; database-tests harus dijalankan ulang pada commit perbaikan sebelum fitur dinyatakan lolos CI.
- Perubahan hanya pada runner pengujian dan dokumentasi. Tidak ada migrasi yang diterapkan ke Supabase production; project Supabase kedua tidak disentuh.

## 2026-11-25 — Koreksi delimiter tes kelulusan setelah CI #261

- CI #261 (run `45544507071`) masih gagal pada `tests/database/run.sql:349` dengan `syntax error at or near "$"`. Inspeksi file branch menunjukkan blok PL/pgSQL kelulusan masih menggunakan pembuka `do $` dan penutup `$;`.
- Mengganti delimiter khusus blok kelulusan menjadi pasangan `do $$` dan `$$;`, lalu memverifikasi pembuka dan penutup baru pada konten sebelum commit.
- Job `check` CI #261 sukses; database-tests masih gagal sampai workflow baru menyelesaikan seluruh assertion.
- Tidak ada migrasi yang diterapkan ke Supabase production dan project Supabase kedua tidak disentuh.


## 2026-11-25 — CI #262 kelulusan massal hijau

- GitHub Actions run #262 (`45545066948`) pada commit `c2765514f141cef1853172deaec34398043533f1` selesai dengan conclusion `success`.
- Run ini memvalidasi job pemeriksaan aplikasi dan database-tests; koreksi delimiter PL/pgSQL pada blok uji kelulusan sudah lolos.
- Migrasi `20261124290000_class_capacity_enrollment_guard.sql`, `20261124300000_bulk_class_promotion.sql`, dan `20261124310000_bulk_student_graduation.sql` tetap belum diterapkan ke Supabase production. CI menggunakan PostgreSQL disposable.
- Belum ada klaim pengujian UI/browser lokal. Setelah pull, pengguna tetap perlu menguji form kelulusan kelas XII, tanggal, hasil status, dan riwayat sebelum deployment database.
- Project Supabase Website Sekolah production maupun project Supabase kedua tidak disentuh.


## 2026-11-25 — Pengamanan privasi dan penempatan siswa individual

- Audit halaman `/admin/kelas` menemukan query data induk siswa dan roster penempatan dijalankan tanpa memeriksa `students:view`, sementara tabel roster juga dirender untuk semua akun dengan `classes:view`. Memperbaiki agar query siswa/roster hanya dijalankan dan ditampilkan bila akun memiliki `students:view`.
- Form penempatan individual sekarang hanya tersedia dalam area yang dilindungi `students:view`; server action juga memeriksa `classes:view`, `classes:update`, `students:view`, dan `students:update` sehingga tidak bergantung pada visibilitas UI.
- Server action memverifikasi bahwa kelas tujuan berada pada tahun ajaran aktif, menolak pemilihan kelas yang sama dengan penempatan saat ini, serta menampilkan pesan sukses/error khusus penempatan.
- Perubahan hanya pada halaman admin dan server action serta dokumentasi. Tidak ada perubahan migrasi atau data Supabase; migrasi 2900–3100 tetap belum diterapkan ke production dan project Supabase kedua tidak disentuh.
- Status verifikasi: menunggu CI; belum ada klaim uji browser/local.


## 2026-11-25 — CI #264 hijau dan keputusan deployment database

- GitHub Actions run #264 (`45546928971`) pada commit `97bc9b619561201d43c59395555da6956056c435` selesai dengan conclusion `success`; job `check` dan `database-tests` keduanya hijau.
- Job `check` meliputi install dependency, lint, typecheck, unit test, dan build. Job `database-tests` berhasil menjalankan migrasi serta assertion PostgreSQL disposable, termasuk tes konkurensi kapasitas kelas.
- Hasil CI memverifikasi kode dan migrasi dalam lingkungan tes terisolasi; bukan penerapan atau verifikasi langsung pada Supabase production.
- Audit ulang status deployment: migrasi `20261124290000_class_capacity_enrollment_guard.sql`, `20261124300000_bulk_class_promotion.sql`, dan `20261124310000_bulk_student_graduation.sql` masih pending di production. Fondasi 2500–2800 sebelumnya telah dikonfirmasi pengguna diterapkan.
- Tidak menerapkan migrasi production pada sesi ini. Sebelum deployment, pengguna perlu menyelesaikan smoke test UI (kapasitas, penempatan dengan/tanpa `students:view`, kenaikan massal, dan kelulusan kelas XII), memastikan backup production tersedia, lalu memeriksa `supabase migration list --remote` pada project Website Sekolah yang benar. Jangan menyentuh project Supabase kedua.
- Jika riwayat remote menunjukkan hanya migrasi 2900–3100 yang tertunda dan backup sudah dipastikan, jalankan penerapan berurutan 2900 → 3000 → 3100, lalu verifikasi ulang daftar migrasi remote dan alur aplikasi. Hentikan bila ada versi tak dikenal atau ketidaksesuaian riwayat.
- Belum ada pengujian browser/local yang diklaim dan tidak ada SQL yang dijalankan terhadap Supabase production.


## 2026-11-25 — Pengamanan perubahan status melalui form data induk

- Audit alur CRUD siswa menemukan form umum tambah/edit mengizinkan pemilihan status `active`, `graduated`, `transferred`, atau `withdrawn` dan pengisian tanggal kelulusan secara langsung.
- Ini berpotensi melewati aturan proses akademik khusus, misalnya kelulusan massal yang hanya boleh dilakukan untuk rombel XII pada tahun ajaran aktif, serta membuat status/tanggal kelulusan tidak sinkron dengan riwayat.
- Form umum sekarang hanya mengelola data induk. Siswa baru selalu dibuat dengan status `active` dan `graduation_date = null`; saat edit, server action tidak mengirim kolom status/tanggal kelulusan sehingga nilai lifecycle yang sudah ada tetap dipertahankan.
- Menghapus field status dan tanggal kelulusan dari schema/form generik. UI memberi keterangan bahwa perubahan status harus melalui proses akademik khusus. Detail siswa tetap menampilkan status dan tanggal kelulusan.
- Perubahan ini tidak mengubah migrasi atau database production. Proses khusus untuk status `transferred` dan `withdrawn` masih perlu dirancang terpisah; fitur kelulusan XII tetap memakai RPC khusus.
- Status verifikasi: menunggu CI dan uji pengguna. Tidak ada pengujian lokal yang diklaim; tidak ada project Supabase yang disentuh.

## 2026-11-25 — Perbaikan CI #266: test schema lifecycle siswa

- GitHub Actions run #45548734154 (CI #266) gagal hanya pada job `check`, langkah `pnpm test`; job `database-tests` berhasil.
- Log menunjukkan satu unit test lama di `tests/unit/student-schema.test.ts` masih mengharapkan schema form data induk menolak tanggal kelulusan sebelum tanggal lahir.
- Ekspektasi tersebut sudah tidak sesuai dengan desain terbaru: `status` dan `graduation_date` sengaja dikeluarkan dari schema umum agar perubahan lifecycle hanya melalui alur akademik khusus. Zod mengabaikan properti asing secara default.
- Memperbarui unit test agar memverifikasi bahwa payload legacy yang memuat status/tanggal kelulusan tidak menyebabkan schema umum gagal dan kedua properti tersebut tidak masuk ke hasil parse.
- Tidak mengembalikan field lifecycle ke form umum, tidak mengubah migrasi/database, dan tidak menyentuh Supabase production maupun project kedua.
- Status verifikasi: perubahan test dan dokumentasi didorong ke branch `main`; menunggu CI baru. Jangan menyatakan CI hijau sebelum run baru selesai.

## 2026-11-25 — Pengamanan lifecycle siswa pada batas privilege database

- Audit setelah CI #267 hijau menemukan bahwa migrasi fondasi masih memberikan privilege tabel-level `INSERT` dan `UPDATE` kepada role `authenticated`. Menghapus field status dari form/server action belum cukup: klien Supabase langsung masih dapat mencoba mengirim `status` atau `graduation_date`.
- Menambahkan migrasi baru `20261124320000_student_lifecycle_column_guards.sql`: mencabut privilege tabel-level INSERT/UPDATE, lalu memberi privilege kolom hanya untuk data induk; kolom `status`, `graduation_date`, `created_by`, dan `updated_by` tidak dapat ditulis langsung oleh role authenticated.
- Trigger audit baru menetapkan `created_by` / `updated_by` dari `auth.uid()`. Form/server action tidak lagi mengirim field audit maupun lifecycle; status awal menggunakan default database `active`.
- RPC kelulusan kelas XII diubah menjadi SECURITY DEFINER dengan `search_path = ''`, tetap memeriksa empat permission dan aturan kelas XII/tahun ajaran aktif sebelum mengubah status/tanggal. Ini diperlukan karena SECURITY INVOKER tidak dapat melewati pembatasan kolom baru. Eksekusi hanya diberikan kepada authenticated.
- Runner PostgreSQL disposable menambahkan migrasi 3200 dan assertion bahwa insert/update lifecycle langsung ditolak, insert siswa tetap default aktif, metadata actor dipercaya dari JWT, dan trigger riwayat tetap berjalan; skenario kelulusan tetap menguji RPC khusus.
- Memperbarui keterangan halaman edit agar sesuai dengan alur lifecycle khusus.
- Tidak ada migrasi yang diterapkan ke Supabase production dan project Supabase kedua tidak disentuh. Urutan deployment kini 2900 → 3000 → 3100 → 3200 setelah fondasi 2500–2800.
- Status verifikasi: menunggu CI. SECURITY DEFINER RPC dan perubahan privilege harus lulus seluruh database-tests sebelum dianggap siap.


## 2026-11-25 — Perbaikan CI #268: privilege kolom ID siswa

- GitHub Actions run #268 (`45555596174`) pada commit `05c45e20a647279c2175ba82d57f0b8b2156a89f` gagal hanya pada job `database-tests`; job `check` sukses.
- Log PostgreSQL menunjukkan fixture uji langkah 5 gagal saat melakukan INSERT siswa dengan ID eksplisit: privilege INSERT kolom `id` belum diberikan setelah privilege tabel-level dicabut.
- Memperbaiki migrasi `20261124320000_student_lifecycle_column_guards.sql` dengan memberikan privilege INSERT kolom `id` kepada role authenticated. Kolom lifecycle (`status`, `graduation_date`) dan audit (`created_by`, `updated_by`) tetap tidak dapat ditulis langsung; privilege UPDATE untuk `id` juga tetap tidak diberikan.
- Perbaikan mempertahankan pembatasan lifecycle di database dan mendukung fixture serta klien yang menentukan UUID saat INSERT. Tidak mengubah RPC kelulusan atau kebijakan RLS.
- Belum ada klaim CI ulang berhasil sampai workflow pada commit perbaikan selesai. Migrasi 3200 tetap belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


## 2026-11-25 — Mutasi siswa: pindah dan mengundurkan diri

- Pengguna mengonfirmasi aturan domain: ketika siswa pindah atau mengundurkan diri, penempatan kelas pada tahun ajaran aktif harus ditutup otomatis, kapasitas kelas dibebaskan, dan riwayat penempatan lama tetap disimpan.
- Baseline GitHub Actions CI #269 pada commit `79c27dcdac1526f0fa9b35f98c0dab2cbd11063c` dikonfirmasi hijau oleh pengguna.
- Menambahkan migrasi baru `20261124330000_student_transfer_withdrawal.sql`: kolom `ended_at` dan `ended_by` pada enrollment; pembatasan privilege agar klien authenticated tidak dapat menutup atau mengubah metadata penutupan secara langsung; trigger counter membebaskan slot saat penempatan ditutup; RPC `transition_student_status` memeriksa permission dan mengubah status serta menutup enrollment tahun ajaran aktif dalam satu transaksi.
- Enrollment dan `student_class_history` tidak dihapus. Baris penempatan ditandai berakhir sehingga histori tetap dapat ditelusuri. Penutupan hanya menyasar penempatan pada tahun ajaran aktif; penempatan tahun ajaran sebelumnya tidak diubah.
- Menambahkan server action dan kontrol pada detail siswa untuk status `transferred` dan `withdrawn`; perubahan status tetap tidak tersedia pada form data induk.
- Daftar roster kelas dan penempatan tahun ajaran aktif hanya menampilkan enrollment yang belum ditutup. Server action perpindahan kelas tidak lagi mengirim metadata audit yang dilindungi.
- Runner PostgreSQL disposable ditambah assertion privilege, transfer, withdrawal, pengurangan counter kapasitas, dan retensi riwayat penempatan/status.
- Status verifikasi implementasi: menunggu CI. Tes lokal tidak dijalankan oleh asisten. Migrasi 3300 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh. Jangan menjalankan migrasi production tanpa persetujuan eksplisit, backup, dan pemeriksaan urutan.


### Catatan verifikasi awal migrasi mutasi siswa

- CI #271 menunjukkan bahwa penggantian trigger guard awal belum mempertahankan reservasi kapasitas kelas tujuan saat perpindahan kelas biasa. Job aplikasi (lint, typecheck, unit test, build) lolos; database-tests berhenti pada assertion counter perpindahan.
- Memulihkan mekanisme reservasi slot atomik dan penguncian rombel dari migrasi kapasitas 2900 di dalam trigger guard baru, sambil tetap menambahkan validasi penutupan enrollment. Koreksi ini mempertahankan perilaku perpindahan kelas yang sudah ada.
- CI #272 dan #273 gagal pada revisi sebelum koreksi trigger kapasitas; hasil dan perbaikannya dicatat pada bagian verifikasi akhir di bawah.


### Verifikasi akhir mutasi siswa — CI #274 hijau

- GitHub Actions run #274 (`45562790576`) pada commit `896c10f647c44a2dc8cc29628425176c9fa71550` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test, dan build seluruhnya sukses.
- Job `database-tests`: seluruh migrasi dan assertion PostgreSQL sukses, termasuk tes transfer dan pengunduran diri, privilege penutupan enrollment, pelepasan kapasitas, retensi riwayat, konkurensi aktivasi tahun ajaran, serta konkurensi kapasitas kelas.
- Kegagalan database-tests pada CI #271–#273 menjadi umpan balik iteratif: #271/#272/#273 menangkap bahwa trigger guard mutasi harus tetap mempertahankan reservasi kapasitas saat perpindahan kelas biasa; koreksi di commit `896c10f` mengembalikan mekanisme lock dan reservasi atomik. CI #274 memvalidasi koreksi tersebut.
- Status fitur mutasi siswa: CI hijau. Uji UI/browser oleh pengguna masih diperlukan setelah pull.
- Migrasi `20261124330000_student_transfer_withdrawal.sql` belum diterapkan ke Supabase production. Penerapan production tidak dilakukan oleh asisten; project Supabase kedua tidak disentuh. Ikuti urutan migrasi yang tercatat dan lakukan backup serta verifikasi target sebelum deployment dengan persetujuan eksplisit pengguna.

## 2026-11-25 — Verifikasi browser mutasi siswa: transfer berhasil

- Pengguna mengonfirmasi ada perubahan/migrasi yang sebelumnya belum di-push; setelah melakukan push, pengujian melalui browser diterima sistem.
- Pengguna berhasil mengubah status seorang siswa menjadi `transferred` melalui alur detail siswa. Ini mengonfirmasi jalur UI → server action → RPC `transition_student_status` dapat dijalankan pada environment yang diuji.
- Hasil ini melengkapi CI #274 yang sebelumnya hijau untuk lint, typecheck, unit test, build, dan database-tests termasuk transfer/withdrawal, pelepasan kapasitas, serta retensi riwayat.
- Pengujian browser yang dikonfirmasi secara eksplisit baru mencakup status `transferred`; alur `withdrawn` belum dikonfirmasi oleh pengguna.
- Status penerapan migration: pengguna melaporkan push yang tertinggal telah dilakukan dan alur transfer browser berhasil. Asisten tidak menjalankan atau mengubah database production.
- Project Supabase kedua tidak disentuh.



## 2026-11-25 — Fondasi onboarding akun Portal Siswa

- Keputusan produk: dua jalur berjalan berdampingan, yaitu undangan yang dibuat admin untuk satu data siswa dan pendaftaran mandiri yang wajib diverifikasi admin.
- Menambahkan migrasi `20261124340000_student_portal_account_onboarding.sql`: relasi satu-ke-satu akun Auth ↔ data siswa, antrean pendaftaran mandiri, undangan sekali pakai dengan token acak 256-bit yang disimpan sebagai hash SHA-256, role terbatas `siswa`, serta permission `student_portal:view`.
- Pembuatan undangan mensyaratkan `students:view` dan `students:update`, hanya untuk siswa aktif tanpa akun portal, dan token berlaku tujuh hari. Token mentah hanya dikembalikan saat RPC membuat undangan; database hanya menyimpan hash.
- Klaim undangan menghubungkan akun Auth yang sudah dibuat, mengaktifkan profil, dan memberikan role siswa secara atomik. Pendaftaran mandiri tetap nonaktif tanpa role sampai admin menyetujui; persetujuan mencocokkan NIS, nama, tanggal lahir, dan status siswa aktif secara persis.
- Fungsi profil Portal Siswa hanya mengembalikan nama, NIS/NISN, status, tahun masuk, jurusan, kelas, dan tahun ajaran; tidak membuka alamat, tanggal lahir, telepon wali, atau catatan internal. Tidak ada policy SELECT umum untuk tabel students bagi role siswa.
- Pengujian PostgreSQL disposable ditambah untuk klaim undangan, aktivasi tertunda pendaftaran mandiri, pencocokan data saat approval, role terbatas, larangan direct write, dan pembatasan kolom profil.
- Tahap ini baru fondasi database/RPC. UI pendaftaran, halaman antrean admin, undangan dari detail siswa, login routing khusus siswa, dan dashboard Portal Siswa belum dibuat.
- Migrasi baru belum diterapkan oleh asisten ke Supabase production. Jangan jalankan migration push sebelum backup, pemeriksaan urutan remote, dan persetujuan eksplisit. Project Supabase kedua tidak disentuh.
- Verifikasi CI untuk commit ini menunggu hasil GitHub Actions; belum ada klaim tes lokal.


### Catatan CI #277 — penyesuaian skema fixture dan assertion onboarding

- Database-tests CI #277 menemukan kolom `departments.name` tidak ada pada fixture minimal; skema production memang memiliki kolom tersebut. Fixture diperbarui agar fungsi profil dapat dikompilasi.
- Memisahkan assertion administratif dari role `authenticated`; tes kini tetap memanggil RPC pada role yang sesuai, tetapi membaca tabel internal untuk assertion setelah reset role database.
- Menghapus undangan lama yang belum diklaim sebelum menerbitkan token baru untuk siswa yang sama, sehingga indeks unik undangan aktif tidak menghalangi penerbitan ulang.
- CI #277 database-tests gagal pada tahap pembuatan fungsi profil; tidak ada klaim kelulusan CI. Koreksi dikirim sebagai commit baru dan menunggu run berikutnya.


## 2026-11-25 — Alur autentikasi Portal Siswa

- Menambahkan validasi pendaftaran Portal Siswa: email, password minimal delapan karakter, nama, serta NIS/tanggal lahir untuk jalur mandiri atau token 64 karakter untuk jalur undangan.
- Server action menggunakan Supabase Auth sign-up. Metadata onboarding diproses setelah sesi tersedia; bila konfirmasi email diaktifkan, pemrosesan ditunda sampai login pertama setelah verifikasi email.
- Login memproses klaim undangan atau pengajuan mandiri yang tertunda, lalu mengarahkan role `siswa` ke `/portal`; akun tanpa role tetap ditolak dan di-sign-out.
- Pemisahan guard server: `requireAdmin` tidak menerima role siswa, sedangkan `requireStudent` hanya menerima role siswa.
- UI halaman pendaftaran, antrean verifikasi admin, undangan detail siswa, dan dashboard Portal Siswa akan ditambahkan pada commit lanjutan. CI untuk perubahan autentikasi ini menunggu workflow baru.
- Migrasi 3400 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


## 2026-11-25 — UI onboarding dan dashboard awal Portal Siswa

- Menambahkan halaman `/portal/daftar` dengan dua jalur: pendaftaran memakai kode undangan admin atau pendaftaran mandiri memakai nama, NIS, tanggal lahir, email, dan password.
- Menambahkan halaman `/portal/menunggu` untuk status pengajuan mandiri yang belum disetujui.
- Menambahkan dashboard awal `/portal` melalui RPC profil terbatas; role siswa tidak membaca langsung tabel privat `students`.
- Menambahkan halaman admin `/admin/akses-siswa` untuk meninjau, menyetujui, atau menolak pengajuan. Approval mensyaratkan NIS, nama, tanggal lahir, dan status siswa aktif cocok persis.
- Detail siswa menyediakan pembuatan token undangan sekali pakai; token hanya ditampilkan kepada admin saat dibuat dan harus dibagikan secara pribadi.
- Jalur undangan adalah undangan admin, bukan pembuatan password/Auth user secara langsung. Siswa menetapkan password sendiri. Pembuatan Auth user langsung oleh admin memerlukan Auth Admin API secret terpisah yang belum dikonfigurasi dan tidak ditambahkan.
- UI dan auth flow menunggu CI baru serta uji browser pengguna. Migrasi 3400 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


### Catatan validasi UI Portal Siswa

- Menambahkan unit test schema pendaftaran untuk kedua jalur (token undangan dan mandiri), format token, tanggal kalender, email, serta panjang password.
- Memperbaiki pola validasi tanggal agar memeriksa digit tahun/bulan/hari dengan benar.
- Perubahan UI Portal Siswa di commit sebelumnya menunggu hasil CI; verifikasi browser belum dilakukan.


### Koreksi pola tanggal pada schema pendaftaran

- Review kode setelah penambahan unit test menemukan pola tanggal tersimpan dengan escape ganda sehingga regex tidak mengenali digit tanggal.
- Mengoreksi pola menjadi digit regex standar dan mempertahankan validasi kalender ISO.
- Unit test baru akan memverifikasi koreksi ini pada CI berikutnya.


### Catatan CI #280 — tipe activity action

- CI #280 pada commit `4c0544ef`: lint sukses, database-tests sukses, tetapi typecheck gagal karena union `ActivityAction` tidak memiliki nilai `approve` dan `reject`.
- Menggunakan action `verify` yang memang tersedia pada tipe activity log untuk kedua keputusan verifikasi; ringkasan log tetap membedakan persetujuan dan penolakan.
- CI #281/#282 akan memverifikasi koreksi ini beserta validasi tanggal pendaftaran yang diperbaiki.


## Verifikasi akhir onboarding Portal Siswa — CI #283 hijau

- GitHub Actions run #283 (`45566247613`) pada commit `93402b9aa5c0762ec825dc6d7def7cfc7f3285c4` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test (termasuk schema pendaftaran Portal Siswa), dan build seluruhnya sukses.
- Job `database-tests`: migrasi 2500–3400 serta seluruh assertion onboarding lulus; tes konkurensi aktivasi tahun ajaran dan kapasitas kelas juga sukses.
- Perbaikan yang ditangkap CI selama iterasi: fixture jurusan harus menyertakan `departments.name`; delimiter PL/pgSQL dan assertion role database disesuaikan; activity log menggunakan enum `verify`; regex tanggal pendaftaran diperbaiki.
- Fitur onboarding dan dashboard awal sudah tersedia di branch `main`; belum ada uji browser yang dikonfirmasi untuk alur Portal Siswa.
- Migrasi `20261124340000_student_portal_account_onboarding.sql` belum diterapkan oleh asisten ke Supabase production. Lakukan pemeriksaan migration list remote, backup, dan persetujuan sebelum deployment. Project Supabase kedua tidak disentuh.
- Uji browser berikutnya: buat undangan dari detail siswa aktif, daftar menggunakan token, login ke `/portal`; lalu uji pendaftaran mandiri, pastikan akun tetap tertahan, setujui di `/admin/akses-siswa`, dan login kembali. Uji juga token kedaluwarsa/salah, data identitas tidak cocok, serta akun siswa yang sudah terhubung.

## 2026-11-25 — Hardening status akun Portal Siswa (migrasi 3500)

- Review sebelum deployment menemukan bahwa RPC klaim undangan dan approval pendaftaran belum secara eksplisit memverifikasi status akun `public.users` saat proses aktivasi.
- Menambahkan migrasi baru `20261124350000_student_portal_onboarding_account_state_guard.sql`; migrasi 3400 tidak diubah agar tetap immutable.
- `claim_student_portal_invitation` kini mengunci row akun dan hanya menerima akun yang masih `is_active = false` serta `deleted_at IS NULL`. Pemeriksaan dilakukan sebelum token dikonsumsi atau relasi akun dibuat.
- `approve_student_portal_registration` menerapkan pemeriksaan yang sama setelah mengunci request dan row akun, sebelum penautan siswa.
- Menambahkan assertion database untuk menolak klaim undangan dari akun aktif dan menolak approval jika akun menjadi aktif setelah pendaftaran. Pengujian memastikan token tidak dikonsumsi, relasi tidak dibuat, dan request tetap pending.
- `tests/database/run.sql` menerapkan migrasi 3500 setelah 3400 dan menjalankan skenario regresi tambahan.
- Perubahan disiapkan pada branch `main`; CI wajib hijau sebelum deployment. Belum ada migrasi yang diterapkan ke Supabase production.
- Backup gratis dibuat pengguna pada 2026-11-25: `web-sekolah-20261125-before-student-portal.dump`, ukuran 550 KB, TOC 789 entri, SHA-256 `c146afa3c7e4a46f154dae19d98ae3a7160b5606b5d2982fefccf15ff170d20b`. Arsip berhasil dibaca `pg_restore --list`; full restore belum diuji. Pastikan permission file `600` sebelum deployment.
- Target deployment tetap hanya Supabase Website Sekolah `nofznzznzjsvnkrmzpwx`. Jangan menyentuh project Supabase kedua.

### Hasil CI #286 — hardening Portal Siswa

- GitHub Actions run #286 (`45569059580`) pada commit `30f818ff0a46f2667244cf54eede4dca397c96e7` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test, dan build seluruhnya sukses.
- Job `database-tests`: migrasi 2500–3500, assertion onboarding, penolakan akun Auth yang sudah aktif, serta tes konkurensi aktivasi tahun ajaran dan kapasitas kelas seluruhnya sukses.
- Hasil ini hanya memverifikasi CI pada database fixture terisolasi. Migrasi 3400 dan 3500 belum diterapkan ke Supabase production; jangan jalankan `db push` sebelum migration list remote, pemeriksaan backup/permission, dan persetujuan deployment.


## 2026-11-25 — Pemulihan migrasi hardening Portal Siswa

- Pemeriksaan setelah pengguna menjalankan `git pull origin main` menemukan commit dokumentasi `9435460c9c91ae08104c6a96a25f36855240ae23` secara tidak sengaja menghapus file migrasi `20261124350000_student_portal_onboarding_account_state_guard.sql` dan 81 baris assertion hardening dari `tests/database/run.sql`.
- Memulihkan migrasi 3500 dan runner database lengkap dari commit tervalidasi sebelumnya `30f818ff0a46f2667244cf54eede4dca397c96e7`; migrasi 3400 tetap tidak diubah.
- CI #286 memang hijau pada commit sebelum penghapusan, tetapi tidak memvalidasi keadaan branch setelah penghapusan. CI wajib dijalankan ulang pada commit pemulihan sebelum deployment.
- Pemeriksaan Supabase production menunjukkan migrasi 3400 belum diterapkan; 3500 tidak tercantum di remote karena belum ada di repository lokal/branch saat pemeriksaan. Backup pengguna berukuran 562.928 byte dengan permission `600`.
- Tidak ada `db push`, perubahan database production, atau perubahan pada project Supabase kedua. Deployment tetap menunggu CI baru dan persetujuan eksplisit pengguna.


## 2026-11-25 — Mempermudah akses publik pendaftaran Portal Siswa

- Audit repository memastikan halaman publik `/portal/daftar` dan formulir pendaftaran dua jalur (kode undangan atau mandiri) sebenarnya sudah tersedia; tautan pendaftaran juga sudah ada di formulir login.
- Temuan UX: halaman pendaftaran belum cukup terlihat dari website publik, sehingga pengunjung dapat mengira formulir belum tersedia.
- Menambahkan tautan **Portal Siswa** pada header desktop dan CTA **Daftar Portal Siswa** pada hero beranda agar siswa/orang tua dapat menemukan formulir tanpa harus membuka halaman login terlebih dahulu.
- Route pendaftaran tetap menggunakan halaman yang sama; tidak membuat formulir atau endpoint duplikat. Jalur mandiri tetap memerlukan persetujuan admin sebelum akun diaktifkan.
- Perubahan ini hanya pada navigasi/penemuan halaman publik. Tidak mengubah skema database, migrasi, atau data production.
- CI untuk commit navigasi ini menunggu hasil GitHub Actions; browser QA publik masih perlu dilakukan setelah deployment aplikasi.


## 2026-11-25 — Perbaikan pendaftaran Portal Siswa dan persetujuan daftar mandiri

- Audit alur browser menunjukkan pesan `Pendaftaran akun gagal. Periksa email dan password...` berasal dari kegagalan `supabase.auth.signUp()`, sebelum RPC pencocokan NIS/nama/tanggal lahir dijalankan. Jadi pesan tersebut tidak membuktikan bahwa data siswa di database tidak cocok.
- Mengganti pesan generik untuk kegagalan Auth dengan penjelasan berdasarkan kode error yang aman ditampilkan (email sudah terdaftar, format email, password lemah, pembatasan percobaan, signup dinonaktifkan, dan kegagalan pembuatan profil database). Log server hanya mencatat kode/status, bukan email atau password.
- Menambahkan persetujuan eksplisit pada jalur daftar mandiri. Field NIS dan tanggal lahir terkunci sampai checkbox dicentang; validasi server juga menolak permohonan daftar mandiri tanpa nilai persetujuan, sehingga tidak hanya mengandalkan kontrol browser.
- Jalur kode undangan tetap dapat digunakan tanpa checkbox daftar mandiri.
- Memperbarui unit test schema untuk memastikan persetujuan wajib pada daftar mandiri dan tidak diwajibkan untuk jalur undangan.
- Tidak mengubah migrasi atau database production. Belum ada klaim CI/lint/typecheck sampai workflow commit ini selesai.


## 2026-11-25 — Perbaikan regresi unit test pendaftaran Portal Siswa

- CI #290 (`45607411790`) gagal hanya pada satu unit test: `studentPortalSignupSchema` menolak tanggal lahir valid `2010-01-15`.
- Akar masalah: regex validasi tanggal di `src/features/auth/schema.ts` memiliki escaping berlebih (`\\d` pada source), sehingga mencari karakter literal backslash dan huruf d, bukan digit tanggal.
- Memperbaiki regex menjadi digit matcher TypeScript yang benar (`\d`) dan mempertahankan pemeriksaan tanggal kalender agar tanggal seperti 30 Februari tetap ditolak.
- Database tests pada CI #290 sukses; lint dan typecheck juga sukses. Unit test dan build harus dijalankan ulang pada commit perbaikan ini.
- Tidak ada perubahan migrasi atau database production.


## 2026-11-25 — Perbaikan konfirmasi email dan antrean verifikasi Portal Siswa

- Audit laporan redirect menemukan aksi `signUp()` belum mengirim `emailRedirectTo`, sehingga Supabase memakai Site URL proyek (yang saat ini mengarah ke `localhost:3000`). Pendaftaran kini mengarahkan email konfirmasi ke origin website yang sedang diakses dan endpoint aplikasi `/auth/callback`.
- Menambahkan callback server `src/app/auth/callback/route.ts` untuk menukar authorization code menjadi sesi, memproses metadata pendaftaran setelah email terkonfirmasi, menyimpan permohonan melalui RPC `submit_student_portal_registration`, lalu mengeluarkan akun dan mengarahkan pendaftar ke halaman menunggu verifikasi. Jalur undangan juga diklaim setelah konfirmasi.
- Mempertahankan fallback pada proses login untuk akun lama yang metadata pendaftarannya belum sempat diproses.
- Temuan navigasi admin: halaman `/admin/akses-siswa` dan action persetujuan sebenarnya sudah ada, tetapi route tersebut tidak dimasukkan ke daftar route aktif dan tidak memiliki item navigasi. Menambahkan menu **Verifikasi Portal Siswa** dengan permission `students:view`, sehingga antrean pendaftaran dapat ditemukan admin.
- Antrean ini memang terpisah dari `/admin/siswa`: data induk siswa tidak dibuat ulang. Admin memverifikasi dan menautkan akun pendaftar ke siswa aktif yang sudah ada.
- Tidak mengubah migrasi, skema, atau database production. Konfigurasi Supabase Auth URL Configuration tetap harus mengizinkan domain production dengan path callback `/auth/callback`; Site URL sebaiknya disetel ke domain production agar tautan fallback tidak memakai localhost.
- CI #291 untuk perbaikan regex sebelumnya selesai dengan status sukses. Status CI perubahan callback dan navigasi ini menunggu workflow commit terbaru.


## 2026-11-25 — Visibilitas Portal Siswa pada navigasi publik

- Menambahkan Portal Siswa ke daftar navigasi publik di dekat Beranda agar tampil pada menu desktop, dropdown, dan menu mobile.
- Menonjolkan tautan Portal Siswa dengan warna amber pada menu desktop dan mobile; tautan penting di footer juga ditambahkan.
- Menghapus tombol Portal Siswa terpisah pada header agar tidak ada duplikasi tautan.
- Tidak mengubah migrasi atau database production. CI untuk perubahan ini menunggu workflow commit terbaru.


## 2026-11-25 — Pengiriman ulang email konfirmasi Portal Siswa

- Menambahkan aksi server untuk meminta ulang email konfirmasi melalui Supabase Auth resend dengan tipe signup. URL callback memakai host website yang sedang diakses agar tautan kembali ke domain website, bukan localhost.
- Menambahkan formulir Email konfirmasi belum masuk pada halaman pendaftaran. Pendaftar dapat meminta tautan baru tanpa mencoba membuat akun ulang; UI menampilkan pesan untuk pembatasan laju dan akun yang sudah terkonfirmasi.
- Pengiriman ulang tidak membuat akun baru. Fitur ini hanya ditujukan bagi akun yang masih menunggu konfirmasi; akun yang sudah terkonfirmasi harus langsung masuk.
- Tidak mengubah migrasi atau database production. CI untuk commit sebelumnya #292 dikonfirmasi hijau semua; CI untuk perubahan ini menunggu workflow terbaru. Pengujian email nyata tetap diperlukan.


## 2026-11-25 — Perapian navigasi Portal Siswa dan formulir kirim ulang

- Memastikan Portal Siswa tampil sebagai item tersendiri di daftar menu publik desktop dan mobile dengan warna amber yang kontras.
- Menambahkan tautan Portal Siswa ke footer dan menghindari tombol duplikat pada header.
- Menambahkan UI permintaan ulang email konfirmasi pada halaman pendaftaran agar pengguna tidak mencoba signup berulang.
- Tidak ada perubahan database atau migrasi. CI terbaru perlu diverifikasi sebelum menyatakan pemeriksaan lulus.


### Koreksi markup formulir kirim ulang

- Mengganti pemisah baris literal yang sempat tersimpan pada JSX dengan newline sebenarnya agar file dapat diparse oleh ESLint/TypeScript.
- Menunggu hasil CI commit koreksi ini; CI sebelumnya mengidentifikasi parsing error pada file formulir, sementara database tests tetap sukses.


## 2026-11-25 — Pemulihan pengajuan setelah konfirmasi email

- Screenshot browser menunjukkan email sudah terkonfirmasi tetapi RPC penyimpanan pengajuan gagal; callback sebelumnya langsung sign-out sehingga metadata pendaftaran tidak bisa dipakai untuk retry dari halaman yang sama.
- Callback kini mempertahankan sesi dan metadata ketika penyimpanan gagal, serta mencatat kode/pesan/detail error database pada log server untuk diagnosis tanpa menampilkan detail sensitif ke publik.
- Menambahkan aksi Lanjutkan pengajuan yang mengulang RPC memakai metadata akun terkonfirmasi, tanpa membuat akun Auth baru. Duplikat hanya dianggap sukses jika antrean pengajuan milik akun benar-benar ditemukan.
- Memperbaiki JSX formulir yang masih menyimpan karakter literal \\n di antara wrapper dan form.
- Tidak mengubah migrasi atau database production. CI untuk commit ini perlu diverifikasi; pengujian browser perlu memastikan pengajuan masuk ke Verifikasi Portal Siswa.


### Koreksi akhir tampilan pemulihan

- Memastikan urutan kondisi pesan pemulihan memakai grouping boolean yang benar untuk kedua parameter error.
- Koreksi literal pemisah baris JSX divalidasi terhadap isi file pada branch sebelum commit.

- Pemeriksaan isi file memastikan karakter backslash-n literal di awal form diganti menjadi baris baru JSX yang sebenarnya.


## 2026-11-25 — Pemulihan pendaftaran tanpa metadata dan salin kode undangan

- Hasil uji pengguna: CI #299 hijau; callback konfirmasi sudah berhasil, tetapi aksi pemulihan menampilkan metadata pendaftaran tidak ditemukan. Ini menunjukkan data identitas pendaftaran tidak tersedia pada user metadata di sesi pemulihan. Penyebab historis persisnya belum dapat dipastikan dari bukti yang tersedia.
- Memperbaiki aksi pemulihan agar tetap dapat mengirim pengajuan ketika metadata tidak tersedia: pendaftar dapat mengisi ulang nama lengkap, NIS, dan tanggal lahir saat masih login dengan akun terkonfirmasi. Validasi dilakukan di server; RPC database tetap menjadi penjaga bahwa akun harus belum aktif dan belum terhubung.
- Jika metadata masih tersedia, data metadata diprioritaskan. Jika RPC mendeteksi duplikat, sistem hanya melanjutkan bila antrean untuk user yang sama benar-benar ditemukan.
- Menambahkan tombol **Salin kode undangan** pada detail siswa admin. Menggunakan Clipboard API pada HTTPS, menyediakan fallback instruksi salin manual, dan mempertahankan kode agar dapat dipilih/disalin dengan tekan lama.
- Pengiriman ulang email tidak mencoba melewati batas Supabase Auth. Rate limit provider tetap dihormati; pengguna diarahkan menunggu jika batas pengiriman tercapai. Pengujian email nyata diperlukan setelah deployment.
- Tidak mengubah migrasi atau database production. Menunggu CI commit ini.


## 2026-11-25 — Tombol pemulihan langsung terlihat setelah konfirmasi

- Temuan pengguna: pesan callback meminta menekan tombol di bawah, tetapi tombol pemulihan berada setelah formulir pendaftaran dan kirim ulang email yang panjang.
- Route `/portal/daftar?error=lanjutkan` kini mengaktifkan mode pemulihan khusus dan menampilkan formulir pemulihan tepat di bawah pesan konfirmasi, di bagian atas halaman.
- Dalam mode pemulihan, formulir signup baru dan resend email disembunyikan agar pengguna tidak membuat akun baru atau mengirim email lagi secara tidak perlu.
- Pesan `error=konfirmasi` diperjelas agar tidak mengklaim email berhasil dikonfirmasi jika pertukaran kode gagal.
- Tidak ada perubahan database/migrasi. CI dan uji browser setelah deployment masih diperlukan.


- CI #301 menemukan parsing error ESLint: cabang ternary mode pendaftaran menghasilkan dua elemen sibling tanpa fragment. Membungkus formulir signup dan bagian kirim ulang email dalam React Fragment; mode pemulihan tetap satu section. Database tests CI #301 lulus.


## 2026-11-25 — Countdown pengiriman ulang email konfirmasi

- CI #302 pada commit `d7515f94acfdffe5f5de495fb2eb60f0dc0fc189` dikonfirmasi hijau oleh pengguna.
- Menambahkan countdown 60 detik pada tombol kirim ulang email konfirmasi. Setelah signup berhasil mengirim email, timer langsung terlihat; setiap percobaan kirim ulang juga memulai jeda 60 detik berikutnya.
- Tombol dinonaktifkan selama countdown untuk mengurangi klik berulang. Batas ini hanya UX; Supabase tetap menjadi enforcement server-side.
- Menambahkan catatan bahwa layanan email bawaan Supabase memiliki batas 2 email per jam untuk seluruh project (bukan per pengguna). Karena itu countdown 60 detik adalah jeda minimum dan tidak menjamin kuota project sudah tersedia.
- Referensi resmi Supabase: Auth Rate Limits (cooldown signup 60 detik; built-in email provider 2 email/jam), Testing Auth Flows, dan Send Custom SMTP. Tidak ada perubahan SMTP, Auth config, database, atau migrasi.
- Menunggu CI untuk commit countdown ini dan uji browser setelah deployment.


## 2026-11-26 — Audit arsitektur dan pencatatan pekerjaan tertunda

- Audit ulang branch `main`, README, progress, tree repository, riwayat commit, dan workflow terbaru.
- Commit terbaru saat audit: `d5e8401541b2bafcc835e27b23ed06441fc3cbdd`.
- CI #303 sukses pada kedua job: `check` (lint, typecheck, unit test, build) dan `database-tests`.
- Menyelaraskan bagian Status saat ini dengan keadaan repository setelah pengembangan lifecycle siswa dan Portal Siswa.
- Menambahkan `docs/known-issues-and-deferred.md` sebagai daftar terpusat pengujian tertunda, batasan layanan email, verifikasi deployment, dan pekerjaan QA yang belum dikonfirmasi.
- Uji browser pendaftaran Portal Siswa sengaja ditunda oleh pengguna karena pembatasan pengiriman email bawaan Supabase. Countdown 60 detik hanya jeda UX; bukan penambahan kuota email.
- Tidak ada perubahan kode aplikasi, migrasi, konfigurasi runtime, atau database production.
- Rekomendasi fase berikutnya: rancang Modul Absensi Siswa, dimulai dengan aturan pencatatan per hari/rombel, status kehadiran, pencegahan duplikasi, koreksi dengan audit trail, matriks permission, dan kebutuhan rekap. Jangan membuat migrasi sebelum aturan domain disepakati.


## 2026-11-26 — Fondasi undangan akun guru (branch kerja)
- Menambahkan migrasi baru `20261124360000_teacher_account_invitations.sql`: pemetaan privat satu-ke-satu `teacher_user_links`, undangan guru dengan hash token, masa berlaku 24 jam, pencabutan, validasi email terverifikasi dan pencocokan email profil, serta klaim atomik yang mengaktifkan akun dan memberi role `guru`.
- Menambahkan form undangan pada halaman edit profil guru. Admin membuat tautan undangan untuk email yang sudah tercatat pada profil; tautan disalin dan dikirim melalui kanal resmi sekolah (belum mengirim email otomatis).
- Menambahkan halaman aktivasi `/guru/aktivasi`; guru menetapkan password sendiri. Callback Auth mengklaim undangan setelah verifikasi email.
- Login role guru diarahkan ke `/ruang-guru`; guard area admin menolak akun guru murni. Akun dengan role admin yang sah tetap menggunakan area admin.
- `/ruang-guru` saat ini merupakan landing awal, belum memuat roster atau absensi.
- **Belum diuji dan belum diterapkan:** migrasi, flow signup/email/callback, role redirect, dan browser QA. Jangan menjalankan `db push` tanpa persetujuan eksplisit dan pemeriksaan migration list remote.
- Commit dasar branch: `a1043ab4c355e29415c937c8156e5f4bc9f01d76`. Semua file perubahan harus diperiksa CI sebelum merge.


### Catatan perbaikan CI undangan guru
- CI #305: lint lolos; typecheck gagal karena action log memakai nilai `revoke` yang tidak tersedia pada tipe activity action. Database test juga menemukan fixture belum memiliki role `guru`.
- Perbaikan: gunakan action log `update` untuk pencabutan undangan dan pastikan role sistem `guru` tersedia secara idempotent pada migrasi fitur.
- CI #306: lint, typecheck, dan unit test lolos; database test menemukan fixture permission belum mengikuti permission khusus `teacher_accounts:manage`. Perbaikan fixture dan pemberian permission kepada role `admin_sekolah` sudah disiapkan pada commit berikutnya.
- Menambahkan validasi pasangan token/email sebelum signup Auth agar alamat email yang salah tidak membuat akun Auth yatim yang tidak dapat diklaim.
- Status akhir tetap menunggu CI pada commit terbaru; jangan menandai fitur lulus sebelum job database dan build selesai.
- CI #307: typecheck dan unit test lolos; database test menemukan delimiter fungsi validasi token/email terpotong pada migrasi. Fungsi diperbaiki dengan dollar-quote bernama, validasi token heksadesimal tanpa pola ambigu, serta grant execute eksplisit untuk anon/authenticated. Menunggu CI ulang pada commit sesudah perbaikan ini.
- Audit lanjutan menemukan trigger `users_guard` dari onboarding siswa hanya mengizinkan aktivasi mandiri jika ada `student_portal_accounts`. Migrasi guru kini memperluas guard agar akun baru dapat aktif mandiri hanya setelah `teacher_user_links` dibuat melalui klaim undangan terverifikasi. Fixture database kini memasang trigger yang sama dan menguji aktivasi sebelum/sesudah link.
- CI #309: database job berhenti pada bootstrap karena delimiter fungsi trigger fixture memakai `$` tunggal. Fixture diperbaiki memakai delimiter bernama `$stub$`; menunggu CI ulang.
- Penguatan fixture: berikan grant UPDATE pada `public.users` agar skenario pra-klaim benar-benar melewati trigger status (bukan berhenti di privilege tabel), lalu assertion memastikan akun tetap nonaktif saat link belum ada.
- CI #311: guard trigger sudah berjalan, tetapi assertion pasca-penolakan mencoba membaca `public.users` saat masih ber-role authenticated tanpa grant SELECT fixture. Assertion dipindahkan setelah `RESET ROLE`; pengujian tetap menjalankan UPDATE di bawah role authenticated agar trigger yang diuji.
- **CI #312 sukses** pada commit `0da2e49b687fe89a0091a01cad3bb2e2ccc1ffae`: job `check` (lint, typecheck, unit test, build) dan `database-tests` seluruhnya sukses. Cakupan database termasuk penolakan aktivasi sebelum link guru tersedia dan aktivasi setelah klaim undangan.


## 2026-11-26 — Undangan akun guru digabung ke main
- PR #1 `feat(teachers): secure teacher account invitations` berhasil digabung ke `main` melalui squash merge.
- Commit merge: `7ec5cf7589c351f49e4fedddc106c074faf66a02`.
- CI #312 pada commit kode `0da2e49b687fe89a0091a01cad3bb2e2ccc1ffae` sukses; CI #313 pada head PR terakhir `e32d35b858c4a7a6cc37543ba9262fabbc7b3930` juga sukses. Lint, typecheck, unit test, build, database assertions, dan concurrency tests lulus.
- Migrasi `20261124360000_teacher_account_invitations.sql` **belum diterapkan ke Supabase production**. Tidak ada perubahan remote database pada sesi ini.
- Undangan admin saat ini menghasilkan tautan 24 jam untuk disalin dan dikirim manual melalui kanal resmi; belum ada email undangan otomatis.
- Halaman `/ruang-guru` masih landing awal. Belum ada roster kelas atau fitur absensi.
- Tindak lanjut: verifikasi migration list pada project Website Sekolah, pastikan backup, minta persetujuan sebelum deployment, lalu uji signup/verifikasi email pada domain production. Setelah fondasi guru terverifikasi, lanjutkan Modul Absensi Siswa sesuai aturan domain yang telah disepakati.


## 2026-11-26 — Peralihan verifikasi email ke OTP (branch kerja)
- Branch `feat/email-otp-verification` dibuat dari `main`.
- Kode mengalihkan pendaftaran Portal Siswa (undangan dan mandiri) serta aktivasi undangan Guru ke OTP 6 digit melalui Supabase Auth `verifyOtp({ type: "signup" })`.
- Pengiriman ulang kode OTP tersedia pada alur Portal Siswa dan Guru. Callback lama dipertahankan untuk kompatibilitas tautan yang sudah terkirim sebelum perubahan.
- **Konfigurasi eksternal wajib:** template email Signup/Confirmation di Supabase harus menampilkan `{{ .Token }}`; template yang hanya menggunakan `{{ .ConfirmationURL }}` tidak mengirim kode yang dapat dimasukkan di form.
- Konfigurasi dashboard Supabase belum diubah. Belum ada pengujian email nyata/browser production atau verifikasi kuota email provider.
- Tidak ada migrasi, perubahan database, perubahan project Supabase, atau deployment pada sesi ini.

- Pemeriksaan lanjutan setelah commit awal: memperbaiki pembungkusan JSX pada form aktivasi Guru dan mempertahankan tampilan langkah OTP saat validasi server menolak format kode.


- CI run `45833840670` pada commit `62c78826c4c36507490798f20bc9d4e8331b6d3e` sukses penuh: lint, typecheck, unit test, build, database assertions, dan concurrency tests. Ini belum mencakup pengiriman email nyata, browser QA, perubahan template Supabase, atau deployment.


## 2026-11-27 — Perbaikan tahap OTP setelah permintaan kirim ulang
- Audit kode setelah PR #3 digabung menemukan bahwa aksi kirim ulang OTP Portal Siswa hanya mengembalikan pesan/email, tanpa `awaitingOtp`; akibatnya kolom input OTP hanya tampil setelah signup awal berhasil, bukan setelah resend berhasil.
- Perbaikan pada branch `fix/student-otp-resend-flow`: respons resend sukses kini mengaktifkan tahap OTP dan membawa email yang diminta; UI memakai email dari respons resend untuk form verifikasi. Jika resend gagal/rate-limit, tahap OTP tidak diaktifkan oleh aksi resend.
- Terapkan pola state yang sama pada aktivasi Guru agar state verifikasi dan email tetap konsisten.
- Belum ada perubahan database, migrasi, konfigurasi Supabase, atau deployment. Perlu CI dan browser QA setelah PR ditinjau/digabung.


## 2026-11-27 — Diagnosis kegagalan signup setelah peralihan OTP

- Audit kode pada `main` menemukan pesan generik pendaftaran berasal dari fallback `getSignupErrorMessage()` saat Supabase Auth mengembalikan error yang belum dipetakan.
- Peralihan ke OTP membuat keberhasilan signup bergantung pada pengiriman email konfirmasi. Pengguna mengonfirmasi konfigurasi SMTP kustom Supabase telah diselesaikan pada 2026-11-26; pastikan template Confirm signup menggunakan `{{ .Token }}` dan lakukan uji pengiriman terkontrol.
- Memetakan kode Auth `email_address_not_authorized`, `smtp_error`, dan `unexpected_failure` ke pesan yang lebih spesifik agar kendala provider tidak lagi tampil sebagai error duplikasi email yang ambigu.
- **Batas perbaikan:** perubahan kode ini hanya memperjelas pesan error; tidak mengubah konfigurasi SMTP/Supabase. Status keberhasilan signup end-to-end tetap perlu divalidasi melalui uji email nyata.
- Tidak mengubah database, migrasi, konfigurasi Supabase, atau project lain.


## 2026-11-27 — Diagnostik lanjutan signup OTP
- Pengguna melaporkan pesan generik signup tetap muncul setelah pemetaan error pada PR #5.
- Audit menunjukkan fallback masih menyamarkan seluruh kode Auth yang belum dikenal; log signup juga hanya mencatat kode/status tanpa pesan provider.
- Branch `fix/auth-signup-diagnostic-errors` mengubah fallback agar menampilkan kode Auth dan status HTTP (tanpa menampilkan pesan provider mentah kepada pengguna), serta mencatat `error.message` di log server untuk diagnosis.
- Perubahan ini belum membuktikan atau memperbaiki akar kegagalan provider. Setelah deployment, satu percobaan terkontrol diperlukan untuk memperoleh kode diagnostik; jika pesan generik lama tetap tampil persis, periksa deployment Worker atau jalur form/action yang sedang dipakai.
- Tidak ada perubahan database, migrasi, konfigurasi Supabase, atau project lain. CI dan deployment belum diverifikasi.

## 2026-11-27 — Akar kegagalan OTP terkonfirmasi: kredensial SMTP Gmail
- Auth Logs production menunjukkan request `POST /signup` gagal dengan `error_code=unexpected_failure`, HTTP 500, dan respons SMTP Gmail `535 5.7.8 Username and Password not accepted (BadCredentials)`.
- Akar masalah terkonfirmasi berada pada autentikasi SMTP Gmail yang dikonfigurasi di Supabase, bukan pada validasi kode OTP atau komponen input. Supabase tidak dapat mengirim email konfirmasi sehingga signup gagal sebelum aplikasi mengaktifkan state input OTP.
- PR #7 pada branch `fix/gmail-smtp-auth-error-guidance` memetakan pesan Gmail 535 BadCredentials pada signup dan resend menjadi instruksi spesifik untuk admin memperbarui SMTP password menggunakan Google App Password. Pesan mentah provider tetap hanya dicatat di log server.
- Tindakan eksternal wajib: admin membuat Google App Password untuk akun Gmail pengirim (dengan 2-Step Verification aktif), lalu memperbarui password SMTP pada project Supabase Website Sekolah di Authentication → SMTP Settings. Jangan memakai password login Gmail biasa. Pastikan username dan sender email sesuai akun Gmail tersebut.
- Setelah SMTP diperbaiki, lakukan satu uji signup dan satu uji resend terkontrol; pastikan email OTP diterima dan template Confirm signup memakai `{{ .Token }}`. Jangan mengulang percobaan berkali-kali karena batas pengiriman provider.
- Perubahan PR #7 hanya menyentuh pesan diagnostik aplikasi dan dokumentasi. Tidak ada perubahan database, migrasi, secret, konfigurasi Supabase, project lain, atau deployment. CI dan browser QA masih menunggu.


## 2026-11-27 — Penyesuaian panjang OTP Supabase menjadi 8 digit
- Pengguna berhasil menerima email OTP setelah perbaikan SMTP, tetapi menemukan kode yang dikirim Supabase terdiri dari 8 digit sedangkan formulir dan validasi server hanya menerima 6 digit.
- Menyesuaikan input Portal Siswa: petunjuk, label, HTML pattern, dan maxLength menjadi 8 digit; validasi server `verifyStudentPortalOtp` kini menerima tepat 8 angka.
- Menyamakan alur aktivasi akun Guru dengan panjang 8 digit, termasuk input UI, pola HTML, pesan, dan validasi server, agar kedua alur email OTP konsisten dengan konfigurasi Supabase saat ini.
- Perubahan dilakukan pada branch `fix/gmail-smtp-auth-error-guidance` yang menjadi head PR #7. Tidak mengubah konfigurasi Supabase, template email, database, migrasi, atau deployment.
- CI dan pengujian browser/email nyata untuk panjang kode 8 digit masih perlu dijalankan setelah commit ini.
\n\n## 2026-11-27 — Pengikatan undangan Portal Siswa ke email\n- Temuan audit: form data induk siswa tidak memiliki kolom email, sedangkan RPC undangan hanya mengikat token ke `student_id`; klaim undangan sebelumnya tidak membandingkan email Auth dengan email yang dituju. Token dapat diklaim akun dengan email berbeda.\n- Menambahkan field email opsional pada form tambah/edit siswa, validasi server, penyimpanan, dan tampilan detail. Email harus diisi sebelum admin dapat membuat undangan.\n- Menambahkan migrasi `20261127300000_student_portal_invitation_email_binding.sql`: menyimpan `target_email` pada undangan, membuat undangan dari email siswa, dan memvalidasi kecocokan email Auth saat klaim. Undangan lama tanpa `target_email` tidak dapat diklaim; buat ulang setelah email siswa diisi.\n- Form detail siswa menampilkan alamat email target dan instruksi agar pendaftar memakai alamat yang sama.\n- Perubahan berada di branch `fix/student-portal-invitation-email`. Migrasi belum diterapkan ke Supabase; belum ada CI/browser/OTP end-to-end verification. Jangan menyatakan siap produksi sampai CI dan migration tests lulus.\n

## 2026-11-27 — Perbaikan penyimpanan data siswa dan verifikasi pendaftaran mandiri
- Audit PR #8 setelah merge menemukan kode aplikasi menulis `students.email`, tetapi migrasi `20261127300000_student_portal_invitation_email_binding.sql` harus diterapkan secara terpisah ke Supabase production. Jika belum diterapkan, insert/update data siswa gagal karena kolom email belum ada.
- Aksi simpan siswa kini mencatat kode, pesan, detail, dan hint error database pada log server; kode error kolom email yang belum tersedia dipetakan ke pesan yang menyebut nama migrasi yang perlu diterapkan. Email dinormalisasi dengan trim dan lowercase.
- Fungsi persetujuan pendaftaran mandiri diperbarui melalui migrasi `20261127310000_student_portal_registration_identity_normalization.sql`: NIS dibandingkan tanpa whitespace, nama dibandingkan tanpa membedakan kapitalisasi dan dengan spasi berulang dinormalisasi, sedangkan tanggal lahir tetap harus sama persis.
- Database test runner kini menerapkan kedua migrasi terbaru dan menambahkan skenario yang menguji kecocokan NIS/nama walau terdapat spasi dan perbedaan kapitalisasi pada data induk.
- Perubahan berada di branch `fix/student-save-and-registration-approval`; CI, pengujian migrasi, dan verifikasi production belum dilakukan. Migrasi harus diterapkan ke Supabase setelah memeriksa migration list remote dan memastikan urutan migrasi.

- Temuan tambahan dari CI database: migrasi students foundation memakai grant per kolom untuk melindungi status/audit. Karena itu menambahkan `students.email` tanpa grant eksplisit membuat insert/update oleh role `authenticated` ditolak walaupun kolom sudah ada. Migrasi perbaikan kini memberikan `INSERT(email)` dan `UPDATE(email)`; database test menegaskan kedua privilege tersebut tersedia.

- Audit migrasi lanjutan juga menemukan migrasi email PR #8 mengganti RPC klaim undangan dan tanpa sengaja menghilangkan guard akun Auth harus nonaktif/belum dihapus. Migrasi perbaikan terbaru memulihkan guard tersebut sambil mempertahankan pencocokan email undangan; guard yang sama dipertahankan pada RPC persetujuan mandiri.
- Fixture database dirapikan agar perubahan data uji dilakukan sebagai admin dan alamat email undangan sesuai dengan alamat Auth.


## 2026-11-27 — Arsip data siswa dari dashboard admin

- Menambahkan aksi **Arsipkan siswa** pada halaman detail siswa. Aksi memerlukan permission `students:delete` dan konfirmasi teks `HAPUS`; data aktif disembunyikan dari daftar utama.
- Penghapusan dibuat sebagai soft-delete melalui kolom `students.archived_at`, bukan hard-delete, agar riwayat status, penempatan kelas, dan audit akademik tidak rusak atau hilang.
- Dashboard memiliki tampilan **Lihat arsip** dan halaman detail arsip menyediakan aksi pemulihan dengan permission `students:update`.
- RPC database memeriksa permission dan menolak pengarsipan jika siswa masih terhubung ke akun Portal Siswa, memiliki undangan yang belum kedaluwarsa, atau masih mempunyai penempatan kelas aktif. Undangan baru juga ditolak untuk siswa yang sudah diarsipkan.
- Menambahkan database assertions untuk pengarsipan dan pemulihan serta memastikan riwayat status tetap tersimpan.
- Migrasi baru: `20261127320000_student_archive.sql`. Migrasi belum diterapkan ke Supabase production; perlu diperiksa dan diterapkan setelah PR lulus CI.
- Menunggu CI dan uji browser setelah merge/deploy. Tidak ada perubahan pada database production.


## 2026-11-27 — Portal Siswa selesai diuji dan Modul Absensi tahap pertama

- Pengguna mengonfirmasi simulasi pendaftaran Portal Siswa berhasil dan akun dapat login ke portal. Daftar deferred tidak lagi memuat item uji pendaftaran Portal Siswa.
- Keputusan domain absensi disetujui: satu sesi harian per rombel; guru wali kelas pencatat; status hadir/terlambat/sakit/izin/alpa; batas input hari ini hingga 7 hari ke belakang; submit memerlukan seluruh status; koreksi admin wajib alasan; lock/unlock oleh admin; siswa hanya melihat absensi sendiri setelah submit.
- PR #12 dibuat pada branch feat/student-attendance-daily.
- Migrasi 20261127330000_student_daily_attendance.sql menambah sesi, entri, histori koreksi, permission, dan RPC untuk roster, simpan draft, submit, koreksi, lock/unlock, serta pembacaan pribadi siswa.
- Route /ruang-guru menampilkan roster wali kelas dan form draft/submit. Route /admin/absensi menyediakan rekap harian, koreksi, dan lock/unlock. Portal Siswa menampilkan riwayat kehadiran pribadi.
- Database test runner diperbarui untuk menerapkan migrasi dan memeriksa akses tabel serta keberadaan RPC/permission.
- Tidak ada migrasi production yang dijalankan. Browser QA belum dilakukan. Rekap bulanan/persentase dan ekspor masih tahap berikutnya.


## 2026-11-27 — Modul Absensi masuk main dan audit lanjutan

- PR #12 `feat(attendance): implement daily student attendance` merged ke `main` pada merge commit `c7c15aa0bd2aee942a7e30563f10fa53fe27d03b`.
- CI #367 pada commit head PR `0a56f8933d6315d6ddc9bbbe428f49921cbb9fa8` sukses: lint, typecheck, unit test, build, database assertions, serta concurrency tests.
- Audit pasca-merge menemukan ketidaksesuaian UI: RPC membatasi input guru dari hari ini sampai 7 hari sebelumnya, tetapi halaman `/ruang-guru` selalu mengirim tanggal hari ini dan tidak menyediakan date picker.
- Perbaikan pemilihan tanggal sedang dikerjakan pada branch `fix/teacher-attendance-date-range`. Pilihan tanggal divalidasi di server dan batas database tetap menjadi enforcement utama.
- Browser QA absensi dengan akun guru wali kelas, admin, dan siswa masih belum dilakukan. Migrasi absensi belum diterapkan ke Supabase production; tidak ada perubahan production database pada pekerjaan ini.


## 2026-11-28 — PR absensi/arsip merged dan QA admin awal
- PR #13 `fix(attendance): allow teachers to select attendance dates` merged ke `main` melalui `db742ce0f6ba4b3ab546435f0826dfa40cd6c7b3`. Pemilih tanggal guru dan validasi server kini tersedia di main.
- PR #14 `fix(database): make student archive migration safe to resume` merged ke `main` melalui `01d3b0a3171c333a5c97b88cc222c6f9c511a3e5`. Penambahan `students.archived_at` memakai `ADD COLUMN IF NOT EXISTS`, dan database test menguji rerun migrasi.
- Pengguna mengonfirmasi CI seluruhnya hijau sebelum merge.
- Browser QA admin: pengguna mengonfirmasi tab Absensi tampil di dashboard admin dan rekap absensi termuat. Cakupan ini hanya memverifikasi tampilan/rekap harian; koreksi, lock/unlock, input guru, dan riwayat Portal Siswa belum terkonfirmasi.
- Tidak ada migrasi yang diterapkan ke Supabase production. Status migration history dan backup tetap perlu diverifikasi sebelum deployment.


## 2026-11-28 — Rekap bulanan absensi merged dan deployed
- PR #15 dokumentasi QA merged (`f283b144781c777f10a7f98d7da463b3ebe6b7ea`).
- PR #16 rekap bulanan absensi per rombel merged (`fef07c7122728456327fcebe08e76e42c373c26c`). Pengguna mengonfirmasi CI #375 hijau, PR merged, dan migrasi `20261128090000_student_attendance_monthly_summary.sql` sudah diterapkan ke Supabase.
- Rekap bulanan menghitung sesi `submitted`/`locked`, distribusi status, dan persentase `(present + late) / seluruh entri × 100`; draft dikecualikan.
- Pekerjaan berikutnya: ekspor CSV rekap bulanan. Branch `feat/attendance-monthly-csv-export` menambahkan endpoint terproteksi permission `attendance:view_all`, serializer CSV dengan BOM/escaping dan mitigasi formula injection, link unduh pada dashboard, serta unit tests. Menunggu CI dan review.
- Browser QA rekap bulanan/unduh CSV belum dikonfirmasi. Tidak ada perubahan database production untuk ekspor.


## 2026-11-28 — Ekspor CSV absensi bulanan
- PR #17 sudah merged dengan merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`; pengguna mengonfirmasi CI hijau.
- Endpoint ekspor mengambil data dari RPC rekap bulanan, menjaga konsistensi dengan dashboard, dan memerlukan `attendance:view_all`.
- Belum ada migrasi database baru. Browser QA unduh dan validasi isi CSV masih tertunda.

## 2026-11-28 — Penguatan permission penempatan siswa individual
- Audit menemukan policy RLS INSERT/UPDATE `student_class_enrollments` hanya mewajibkan permission update, sedangkan server action penempatan individual juga mensyaratkan `classes:view` dan `students:view`. Klien PostgREST berpotensi melewati pemeriksaan view pada server action.
- Branch `fix/student-enrollment-rbac-guards-main` menambahkan migrasi `20261128100000_student_enrollment_permission_guards.sql`: INSERT/UPDATE kini mensyaratkan `classes:view`, `students:view`, `classes:update`, dan `students:update`.
- Database test menegaskan insert ditolak dan update tidak mengubah penempatan ketika akun tidak memiliki permission view. Browser QA UI tetap tertunda.
- Integrasi branch ke `main` menghilangkan konflik PR #19. CI #396 menemukan delimiter `DO $` yang terpotong menjadi `DO # Progress Pengembangan Website Sekolah

> Dokumen serah terima kerja. Baca sebelum melanjutkan dan perbarui setiap kali ada perubahan kode, database, konfigurasi, keputusan arsitektur, atau hasil pengujian.

## Status saat ini

- **Tanggal pembaruan:** 2026-11-28.
- PR #17 ekspor CSV absensi bulanan sudah merged (merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`); pengguna mengonfirmasi CI hijau. Browser QA unduhan masih tertunda.
- PR #18 regression test lifecycle withdrawn sudah merged (merge commit `42b884b39db0b2c4a94ccf540edd36c1f7954d9d`); CI #393 sukses. Browser QA alur withdrawn masih tertunda.
- **Branch utama:** `main`; PR #12 (modul absensi), PR #13 (pemilihan tanggal absensi guru), PR #14 (idempotensi migrasi arsip siswa), PR #15 (pembaruan dokumentasi QA), dan PR #16 (rekap bulanan absensi), PR #17 (ekspor CSV), dan PR #18 (regression test lifecycle withdrawn) sudah merged. Merge commit PR #13: `db742ce0f6ba4b3ab546435f0826dfa40cd6c7b3`; PR #14: `01d3b0a3171c333a5c97b88cc222c6f9c511a3e5`.
- **CI:** PR #12 (run #367), PR #13 (termasuk run #371), dan PR #14 (run #370) dikonfirmasi pengguna seluruhnya hijau sebelum merge.
- **Tahap fungsional:** website publik/CMS, administrasi siswa/kelas/tahun ajaran/lifecycle, onboarding Portal Siswa, dan tahap pertama Modul Absensi Siswa. Browser QA admin pada 2026-11-28 mengonfirmasi tab Absensi tampil dan rekap harian termuat; koreksi serta lock/unlock belum diuji. Pengguna mengonfirmasi PR #16 sudah merged dan migrasi rekap bulanan sudah dideploy.
- **Portal Siswa:** pengguna mengonfirmasi simulasi pendaftaran berhasil dan akun dapat login pada 2026-11-27. Item pengujian pendaftaran Portal Siswa dihapus dari daftar deferred; cakupan konfirmasi tidak berarti seluruh edge-case sudah diuji.
- **Modul Absensi:** migrasi `20261127330000_student_daily_attendance.sql`, UI guru, rekap/koreksi admin, dan tampilan riwayat Portal Siswa sudah masuk main. Browser QA guru/admin/siswa masih tertunda.
- **Perbaikan lanjutan absensi:** pemilih tanggal guru (hari ini hingga 7 hari kalender sebelumnya), validasi server, dan retensi tanggal setelah submit/error sudah merged melalui PR #13.
- **Rancangan dan keputusan domain:** `docs/attendance-module-design.md`.
- **Daftar tertunda:** `docs/known-issues-and-deferred.md`.
- **Database production:** migrasi absensi belum diterapkan. Periksa migration list remote, review SQL, pastikan backup, dan minta persetujuan eksplisit sebelum deployment. Jangan sentuh project Supabase kedua.
- **Deployment aplikasi:** Cloudflare Workers/OpenNext (`wrangler.jsonc`).
- **Aturan kerja:** jangan mengklaim build/typecheck/test/migrasi/browser QA berhasil tanpa bukti.

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
- Backup otomatis/point-in-time dari Dashboard tidak tersedia pada paket saat ini; karena itu belum ada backup production yang terkonfirmasi.- Keenam migrasi konten sudah ditinjau dan dry-run hanya menampilkan enam file yang diharapkan. Tidak ditemukan `drop table`, `truncate`, atau penghapusan massal data, tetapi ini tidak menghilangkan risiko kegagalan SQL atau perubahan policy.
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
- Pengguna mengonfirmasi menjalankan `pnpm dlx supabase db push --remote` pada project production `Web-Sekolah` (project ref `nofznzznzjsvnkrmzpwx`). CLI menerapkan tepat satu migrasi: `20261124200000_event_publication_storage_guard.sql`; output berakhir dengan `Finished supabase db push.`- Pengguna kemudian menjalankan `pnpm dlx supabase migration list --remote`. Versi `20261124200000` tercatat sama pada kolom Local dan Remote dengan waktu UTC `2026-11-24 20:00:00`. Ini mengonfirmasi migrasi guard publikasi Agenda dan permission penghapusan media Agenda sudah tercatat diterapkan pada production.- Tidak ada migrasi lain yang tertunda pada daftar yang dibagikan: semua versi dari `20261123091127` sampai `20261124200000` tercatat sinkron Local/Remote.- Peringatan pnpm tentang native binary/build scripts, pesan melewati `.gitkeep`, dan notifikasi Supabase CLI versi baru tidak menghalangi operasi; push dan pembacaan daftar migrasi selesai tanpa error.
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

## 2026-11-24 — Menyiapkan konfigurasi Cloudflare Worker Previews

- Pengguna mencoba `pnpm dlx wrangler@4.167.0 preview --name web-sekolah-audit`. Wrangler berhasil melewati autentikasi, tetapi menolak konfigurasi karena `wrangler.jsonc` belum memiliki blok `previews`.
- Dokumentasi Cloudflare menyatakan Worker Previews memerlukan Wrangler 4.135.0 atau lebih baru dan blok `previews` pada konfigurasi; blok boleh kosong jika tidak ada pengaturan Preview khusus.
- Menambahkan `"previews": {}` ke `wrangler.jsonc`. Pengaturan top-level produksi, entry point OpenNext, compatibility flags, dan asset binding tidak diubah.
- Status: perubahan konfigurasi sudah dicommit ke `main`; pengguna perlu menarik perubahan, lalu mencoba kembali `pnpm dlx wrangler@4.167.0 preview --name web-sekolah-audit`.
- Peringatan keamanan: Worker Preview memiliki URL publik secara default dan konfigurasi Preview tidak otomatis mewarisi variabel/secret produksi. Namun, nilai `NEXT_PUBLIC_*` dapat tertanam ke bundle ketika `pnpm cf:build` dijalankan. Build sebelumnya dilakukan saat `.env.local` memuat konfigurasi Supabase produksi; karena itu Preview harus diperlakukan sebagai terhubung ke Supabase produksi sampai dibuktikan sebaliknya. Batasi pengujian pada GET halaman publik; jangan login admin, submit form, upload, atau menjalankan Server Action yang mengubah data.
- Belum ada URL Preview atau hasil browser QA. Jangan menyatakan Preview berhasil sebelum output Wrangler dan uji browser diterima.

## 2026-11-24 — Browser QA Worker Preview (laporan pengguna)

- Pengguna membuka Worker Preview `https://web-sekolah-audit-web-sekolah.soegenglz7.workers.dev` dan melaporkan halaman-halaman yang sudah tersedia dapat dibuka dengan normal, tanpa error.
- Pengguna juga menguji tautan/route PPDB/SPMB dan Siswa; keduanya masih menampilkan halaman tidak ditemukan (404).
- Ini bukan kegagalan runtime Preview berdasarkan laporan yang tersedia. Audit struktur sebelumnya memang mencatat navigasi publik Siswa dan PPDB/SPMB belum memiliki route/implementasi halaman.
- **Status QA:** smoke test browser untuk halaman publik yang sudah diimplementasikan dilaporkan aman oleh pengguna. Route PPDB/SPMB dan Siswa belum lulus QA karena belum dibuat. Tidak ada klaim pengujian admin, form, upload, atau operasi tulis.
- **Tindak lanjut:** rancang dan implementasikan modul Siswa serta PPDB/SPMB secara terpisah; tentukan terlebih dahulu kebutuhan data, alur pendaftaran, akses orang tua/calon siswa, role/permission, dan kebijakan privasi sebelum menambah tabel, route, atau form. Setelah implementasi, jalankan typecheck/lint/test/build dan QA pada environment staging yang aman.


## 2026-11-24 — Awal implementasi Modul Siswa

### Keputusan arsitektur
- Modul Siswa adalah sistem internal sekolah; data induk dan data pribadi siswa tidak ditampilkan di website publik.
- Rencana bertahap: database dan keamanan → Admin Siswa (CRUD/pencarian) → pengelolaan kelas/tahun ajaran → Portal Siswa → integrasi PPDB/SPMB.
- Calon siswa PPDB tetap berada pada domain pendaftaran; hanya pendaftar yang diterima dan menyelesaikan daftar ulang yang dikonversi menjadi data induk siswa.
- Penghapusan bukan alur operasional utama. Status `graduated`, `transferred`, dan `withdrawn` dipakai untuk mempertahankan riwayat.

### Perubahan yang sudah di-commit- `supabase/migrations/20261124250000_students_foundation.sql` (awal: `89cb2278bae75187ad3d02d05751b91761924080`; perbaikan: `4fc518b75ad2ee77acada41826cbbaeaf7beb2a6`):
  - Membuat tabel privat `students` dengan NIS, NISN opsional, nama, jenis kelamin, tempat/tanggal lahir, alamat, wali, kontak wali, jurusan, tahun masuk, status, tanggal lulus, dan catatan.
  - Menambahkan indeks pencarian nama, status, jurusan, dan tahun masuk.
  - Membuat `student_status_history`; trigger otomatis mencatat status awal dan setiap perubahan status, termasuk user yang melakukan perubahan.
  - Review SQL lanjutan menghapus CHECK berbasis `current_date` (fungsi non-immutable untuk CHECK PostgreSQL) dan grant sequence yang tidak diperlukan oleh pengguna aplikasi.
  - Mengaktifkan RLS. Tidak ada policy untuk `anon`; akses authenticated mensyaratkan permission `students:view/create/update/delete`.
  - Permission dasar `students:* ` sudah didefinisikan oleh migrasi RBAC fondasi; role `admin_sekolah` sudah mendapat permission modul students.
- `src/app/admin/siswa/page.tsx` (commit `9d9c9b0047ec0ebdb3c616b3b7c781b4e7220620`):
  - Menambahkan halaman daftar siswa yang memanggil `requirePermission("students:view")`.
  - Menampilkan data minimum yang dibutuhkan pada daftar; tidak menampilkan alamat, tanggal lahir, atau kontak wali.
  - Menyediakan empty/error state. Form tambah/edit dan pencarian belum dibuat.
- `src/components/layout/admin/admin-nav.tsx` (commit `b4eaa9e8ac2d6e27843005e488599206a3fcb3ca`):
  - Mengaktifkan menu Siswa hanya untuk route yang sudah tersedia dan akun dengan permission `students:view`.

### Status dan batas verifikasi
- Ketiga perubahan di atas sudah tersimpan di branch `main`.
- Migrasi `20261124250000_students_foundation.sql` **belum diterapkan ke Supabase**. Jangan menganggap route daftar sudah dapat membaca tabel sebelum migrasi diterapkan.
- Typecheck, lint, test, build, dan pengujian RLS khusus Modul Siswa belum dijalankan/dikonfirmasi setelah perubahan ini.
- Belum ada formulir CRUD, pencarian/filter, halaman detail/riwayat, atau integrasi kelas/tahun ajaran.
- Data siswa tidak ditambahkan ke `publicNav` dan tidak dibuat route publik.

### Langkah berikutnya
1. Tinjau dan terapkan migrasi siswa pada target Supabase yang benar setelah backup dan pemeriksaan migration list.
2. Jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm test`; perbaiki semua error.
3. Implementasikan schema Zod, server actions dengan pemeriksaan permission, create/edit form, detail siswa, pencarian/filter, serta activity log.
4. Uji RLS menggunakan anon dan akun dengan permission berbeda; pastikan anon tidak dapat membaca atau menulis data siswa.
5. Setelah Admin Siswa stabil, lanjutkan Portal Siswa dan integrasi PPDB/SPMB.

### Catatan konsistensi dokumentasi
- Bagian status lama di atas masih memuat sejumlah catatan migrasi dan tahapan yang sudah kedaluwarsa/bertentangan dengan perkembangan berikutnya. Untuk pekerjaan Modul Siswa, gunakan catatan bertanggal terbaru dan verifikasi commit/migration list aktual sebelum menyimpulkan status production.


## 2026-11-24 — Admin Siswa: CRUD aman, pencarian, detail, dan riwayat

- Sebelum perubahan ini, pengguna mengonfirmasi pnpm typecheck, pnpm lint, pnpm test, dan pnpm build selesai tanpa error.
- Pengguna mengirim migration list --remote: seluruh 20 versi Local/Remote sinkron, termasuk 20261124250000_students_foundation.sql pada production project nofznzznzjsvnkrmzpwx.
- Menambahkan validasi Zod untuk NIS, NISN 10 digit, nama, jenis kelamin, tanggal kalender, kontak wali, jurusan, tahun masuk, status, dan tanggal lulus.
- Menambahkan server action create/update dengan validasi server, pemeriksaan sesi dan permission students:create/students:update, Supabase server client dengan RLS tetap aktif, activity log tanpa data pribadi, dan revalidasi route.
- Menambahkan formulir tambah/edit serta route /admin/siswa/tambah dan /admin/siswa/[id]/edit.
- Memperbarui /admin/siswa dengan pencarian nama/NIS/NISN dan filter status. Daftar hanya menampilkan kolom minimum.
- Menambahkan /admin/siswa/[id] untuk detail privat dan 50 riwayat status terakhir. Riwayat dibuat otomatis oleh trigger database.
- Tidak menambahkan operasi hapus permanen; status lulus/pindah/keluar mempertahankan rekam jejak. Tidak ada direktori siswa publik.

### Batas verifikasi
- Kode pada commit ini belum diuji setelah perubahan oleh asisten. Hasil empat pemeriksaan yang dikonfirmasi pengguna berlaku untuk kode sebelum perubahan ini.
- Jalankan ulang pnpm typecheck, pnpm lint, pnpm test, dan pnpm build.
- Uji integrasi: anon tidak dapat membaca students; akun tanpa permission ditolak; students:view dapat membaca daftar/detail/riwayat; students:create dapat membuat siswa; students:update dapat mengubah data dan memicu student_status_history.
- Tes unit baru: tests/unit/student-schema.test.ts. Uji mutasi dengan fixture/staging, bukan data nyata production.

### Langkah berikutnya
1. Tarik commit ke Kali dengan git pull origin main, lalu jalankan ulang empat pemeriksaan.
2. QA di environment aman: daftar, pencarian, filter, tambah data dummy, edit, dan riwayat status.
3. Verifikasi RLS memakai anon dan akun/role dengan permission berbeda. Migration list bukan bukti RLS lulus.
4. Setelah Admin Siswa lolos, rancang pengelolaan kelas/tahun ajaran sebelum Portal Siswa dan integrasi PPDB/SPMB.

### Catatan status terbaru yang mengesampingkan catatan lama
- Migration 20261124250000_students_foundation.sql telah dikonfirmasi tercatat sama pada Local dan Remote pada 2026-11-24; catatan lama yang menyebutnya belum diterapkan sudah kedaluwarsa.
- Typecheck/lint/test/build dilaporkan lolos sebelum implementasi Admin Siswa pada commit ini; belum ada klaim pemeriksaan setelah perubahan ini.


## 2026-11-24 — Perbaikan typecheck Admin Siswa

- Audit log GitHub Actions run 45376947319 pada commit 4a0107045775d675eed6043b829ebea770018d9e menemukan satu kegagalan pada `pnpm typecheck`, tepatnya `src/features/students/student-actions.ts(38,46)`.
- Akar masalah: object payload dibuat sebagai union antara varian `created_by` dan `updated_by`, lalu union itu dipakai untuk operasi Supabase update/insert. Inferensi tipe Supabase menolak varian insert saat memeriksa update.
- Perbaikan: pisahkan object payload umum, lalu tambahkan `updated_by` hanya pada pemanggilan `update()` dan `created_by` hanya pada pemanggilan `insert()`. Tidak mengubah skema database maupun perilaku permission/RLS.
- Pada run tersebut, instalasi dependency dan lint selesai; test/build dilewati karena typecheck gagal. Dua warning lint pada halaman agenda bukan error dan tidak menyebabkan CI gagal.
- Perbaikan ini belum diverifikasi oleh typecheck lokal; verifikasi berikutnya melalui GitHub Actions dan perintah lokal pengguna.


## 2026-11-24 — Fondasi Tahun Ajaran, Kelas, dan Penempatan Siswa

- Mengikuti keputusan pengguna, format nama rombongan belajar menggunakan contoh `X TKJ 1`. Nama kelas disimpan sebagai label yang dapat dibaca; tingkat (X/XI/XII), jurusan, wali kelas, dan tahun ajaran disimpan sebagai relasi terstruktur.
- Menambahkan migrasi baru `20261124260000_academic_years_and_class_groups.sql`: tabel `academic_years`, `class_groups`, `student_class_enrollments`, dan `student_class_history`.
- Satu tahun ajaran aktif dijamin oleh unique partial index. Kelas terikat pada satu tahun ajaran; siswa hanya memiliki satu penempatan per tahun ajaran.
- Trigger database memvalidasi bahwa kelas dan tahun ajaran cocok, serta hanya siswa berstatus aktif yang dapat ditempatkan. Trigger riwayat mencatat penempatan awal dan perpindahan kelas.
- RLS dan grant membatasi data kelas untuk permission `classes:view/create/update/delete`; penempatan dan riwayat memerlukan kombinasi `classes:view` dan `students:view`, sedangkan perubahan penempatan memerlukan `classes:update` dan `students:update`. Tidak ada akses anon.
- Menambahkan halaman privat `/admin/kelas` untuk membuat/mengaktifkan tahun ajaran, membuat rombongan belajar, melihat daftar kelas, dan menempatkan/memindahkan siswa pada tahun ajaran aktif.
- Menambahkan server actions dengan validasi Zod, pemeriksaan permission, activity log, dan revalidasi. Menu Kelas ditampilkan hanya jika route tersedia dan akun memiliki `classes:view`.
- Tidak mengubah migrasi lama dan tidak membuat direktori siswa publik.
- **Status migrasi:** file baru belum diterapkan ke Supabase. Jangan gunakan fitur kelas/penempatan sebelum migration list remote menunjukkan versi ini telah diterapkan.
- **Status verifikasi:** perubahan kode belum dijalankan pada environment lokal. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm build`; audit SQL dan uji RLS pada staging sebelum penerapan production.
- **Catatan batasan awal:** UI tahap pertama menyediakan pembuatan tahun ajaran/kelas dan penempatan siswa; edit/hapus kelas, pengelolaan kapasitas, kenaikan kelas massal, serta laporan wali kelas belum termasuk tahap ini.


## 2026-11-24 — Perbaikan CI awal modul Kelas

- GitHub Actions run `45379534402` pada commit `d1ec83f6785a941b13e170183df2209f16614120` berhasil pada instalasi dependency dan lint, tetapi typecheck gagal.
- Penyebab: nilai action activity log `activate`, `assign_class`, dan `transfer_class` belum termasuk union `ActivityAction`. Ada juga tiga variabel sesi yang tidak dipakai pada server actions.
- Perbaikan: gunakan action yang sudah didukung (`update`, `create`, `status_change`) dan hapus variabel sesi yang tidak diperlukan. Pemeriksaan CI ulang menunggu.


## 2026-11-24 — Audit statis migrasi Siswa dan Kelas (pra-production)

### Ruang lingkup
- Membaca README, status progress terbaru, daftar migrasi pada `main`, serta migrasi fondasi siswa, penguatan RLS/Storage, dan tahun ajaran/rombongan belajar.
- Memeriksa server action penempatan siswa untuk membandingkan validasi aplikasi dengan perlindungan di database.
- Tidak menjalankan SQL terhadap Supabase production, tidak menjalankan `db push`, dan tidak mengubah data production.

### Temuan audit
- Migrasi `20261124250000_students_foundation.sql` membuat data siswa privat: tidak ada policy untuk role `anon`; akses authenticated dibatasi permission RBAC. Riwayat status ditulis oleh trigger dan hanya diberikan hak baca kepada authenticated.
- Migrasi `20261124260000_academic_years_and_class_groups.sql` membuat tahun ajaran, rombongan belajar, penempatan siswa, dan riwayat kelas. RLS membatasi akses; constraint unik mencegah lebih dari satu tahun ajaran aktif dan lebih dari satu penempatan siswa pada tahun ajaran yang sama.
- **Temuan yang diperbaiki dengan migrasi baru:** trigger penempatan sebelumnya menerima nilai `assigned_by` dari klien bila kolom itu diisi. Selain itu, policy UPDATE berbasis baris tidak membatasi perubahan kolom identitas penempatan. Server action saat ini hanya mengubah kelas, tetapi akses PostgREST langsung dengan permission yang sama dapat mencoba mengubah `student_id`, `academic_year_id`, atau metadata penempatan.
- Menambahkan `20261124270000_student_class_enrollment_audit_guard.sql`: actor `assigned_by` selalu diambil dari `auth.uid()`; perubahan `student_id`, `academic_year_id`, `assigned_at`, atau `assigned_by` saat UPDATE ditolak; `updated_by` ditetapkan database dari `auth.uid()`. Validasi kecocokan kelas/tahun ajaran dan status siswa aktif tetap dipertahankan.
- Migrasi baru menggunakan `CREATE OR REPLACE FUNCTION`; migrasi lama tidak diedit.

### Status verifikasi dan batasan
- Ini adalah **review statis kode SQL**, bukan hasil eksekusi PostgreSQL. Belum ada klaim bahwa migrasi baru lolos pada database lokal/staging.
- Belum ada bukti status penerapan migrasi `20261124260000` dan `20261124270000` pada remote terbaru dalam sesi ini. Jangan menerapkan keduanya ke production sebelum backup, pemeriksaan migration list, dan uji pada database lokal/staging.
- Pemeriksaan CI untuk commit terbaru tidak dapat dipastikan dari hasil endpoint workflow yang tersedia pada sesi audit ini. Jangan menyatakan CI terbaru hijau tanpa membuka run yang sesuai.
- Perlu pengujian negatif: anon tidak dapat membaca tabel privat; authenticated tanpa permission ditolak; pengguna berizin tidak dapat memalsukan `assigned_by` atau mengubah identitas penempatan; transfer kelas yang sah tetap menghasilkan riwayat; kelas dan tahun ajaran yang tidak cocok ditolak.
- Aktivasi tahun ajaran pada server action saat ini dilakukan melalui dua request UPDATE terpisah (non-atomik). Ini perlu ditangani pada audit lanjutan, idealnya dengan operasi database transaksional agar kegagalan request kedua tidak meninggalkan kondisi tanpa tahun ajaran aktif.

### Langkah berikutnya
1. Tarik commit terbaru dari `main`.
2. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build`.
3. Audit dan uji migrasi `20261124270000` pada database lokal/staging yang terpisah dari production; sertakan uji RLS dan trigger di atas.
4. Audit atomisitas aktivasi tahun ajaran dan konsistensi relasi kelas/penempatan.
5. Hanya setelah semua bukti uji dan backup tersedia, rencanakan penerapan production secara terpisah.


## 2026-11-24 — Aktivasi tahun ajaran atomik (pra-production)

### Perubahan
- Menambahkan migrasi `20261124280000_atomic_academic_year_activation.sql` yang menyediakan RPC `public.activate_academic_year(uuid)`.
- Fungsi berjalan sebagai `SECURITY INVOKER`, memeriksa permission `classes:update`, dan tetap tunduk pada grants serta RLS pemanggil.
- Perubahan tahun aktif dilakukan dalam satu transaksi PostgreSQL: menonaktifkan tahun aktif sebelumnya lalu mengaktifkan target. Jika target tidak ditemukan/tidak dapat diakses atau operasi gagal, seluruh transaksi dibatalkan.
- Advisory transaction lock digunakan untuk menyerialkan permintaan aktivasi bersamaan dan mengurangi benturan dengan unique partial index satu tahun aktif.
- Server action `activateAcademicYear` sekarang memanggil RPC tersebut, bukan dua request UPDATE terpisah.
- Migrasi lama tidak diedit.

### Status dan pengujian
- Pengguna mengonfirmasi `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` lolos **sebelum** perubahan aktivasi atomik ini.
- Perubahan kode dan migrasi baru belum diuji ulang setelah commit. Wajib jalankan keempat pemeriksaan tersebut setelah pull.
- Belum ada pengujian PostgreSQL lokal/staging untuk RPC, rollback, permission, RLS, dan dua aktivasi bersamaan.
- Tidak ada perintah database yang dijalankan; production tidak disentuh. Jangan jalankan `db push` ke production pada tahap ini.

### Langkah pengujian berikutnya
1. Pull branch `main`.
2. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build`.
3. Pada database lokal/staging terpisah, uji aktivasi normal, target tidak ada (harus rollback dan tahun aktif lama tetap aktif), role tanpa `classes:update` (harus ditolak), serta dua aktivasi bersamaan (harus berakhir dengan tepat satu tahun aktif).
4. Periksa `pnpm dlx supabase migration list --local` hanya jika local Supabase tersedia; jangan menghubungkan atau menerapkan ke production.
5. Setelah bukti uji tersedia, lanjutkan audit relasi dan kebijakan RLS sebelum merencanakan deployment database.


## 2026-11-25 — Validasi kode aktivasi tahun ajaran atomik

- Pengguna mengonfirmasi setelah menarik perubahan aktivasi tahun ajaran atomik bahwa `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` semuanya lolos.
- Konfirmasi ini berlaku untuk kode server action RPC dan migrasi `20261124280000_atomic_academic_year_activation.sql`; hasil tes dicatat sebagai konfirmasi pengguna, bukan eksekusi independen oleh asisten.
- Pengujian PostgreSQL lokal/staging masih belum dilakukan: migrasi 2700 dan 2800, RLS, trigger audit penempatan, rollback RPC, penolakan permission, serta aktivasi bersamaan.
- Production tidak disentuh pada sesi ini. Jangan jalankan `db push --remote` atau SQL Editor production.
- Langkah berikutnya: pastikan Supabase local berjalan pada database terisolasi, lalu periksa `migration list --local` dan jalankan tes integrasi/negatif. Jika local stack tidak tersedia di perangkat, gunakan proyek staging Supabase terpisah (bukan project production).


## 2026-11-25 — Lingkungan Supabase lokal tidak tersedia

- Pengguna menjalankan pemeriksaan Docker dan `pnpm dlx supabase status` dari lingkungan Kali/Termux.
- Docker tidak tersedia; Podman juga tidak ditemukan. Supabase CLI melaporkan tidak dapat memeriksa container health karena runtime container tidak ada.
- CLI menunjukkan repository masih linked ke project `Web-Sekolah` dengan ref `nofznzznzjsvnkrmzpwx`, yaitu project production. Perintah status tersebut tidak menjalankan migrasi atau SQL dan tidak mengubah database.
- Karena local Supabase tidak dapat dijalankan pada lingkungan ini, rencana pengujian database dialihkan ke proyek Supabase staging terpisah. Jangan menjalankan `db push`, SQL Editor, atau tes tulis terhadap project production.
- Langkah berikutnya: buat project staging baru pada organisasi yang sesuai, jangan menyalin data pribadi production, lalu link CLI ke project ref staging sebelum memeriksa migration list atau menerapkan migrasi uji.

## 2026-11-25 — Audit migrasi Siswa dan Kelas tanpa staging tambahan

- Pengguna mengonfirmasi kedua slot project Supabase Free telah digunakan: satu untuk Website Sekolah dan satu untuk website lain. Project kedua tidak boleh dipakai sebagai staging dan tidak boleh disentuh.
- Karena Docker/Podman tidak tersedia di lingkungan Kali/Termux dan tidak ada slot project Supabase staging, audit dilanjutkan secara statis dari file migrasi di branch `main`. Tidak ada SQL yang dijalankan dan tidak ada koneksi/tindakan tulis terhadap project production.
- Membaca ulang `README.md`, bagian terbaru `progress.md`, serta migrasi `20261124250000_students_foundation.sql` sampai `20261124280000_atomic_academic_year_activation.sql`.
- Pemeriksaan statis: migrasi 2500 menjaga tabel siswa dan riwayat status di balik RLS authenticated/RBAC; migrasi 2600 membatasi akses tahun ajaran/kelas/penempatan dan memakai constraint unik untuk satu tahun aktif serta satu penempatan per siswa/tahun; migrasi 2700 memperbaiki kepercayaan pada metadata actor dan mengunci identitas awal penempatan; migrasi 2800 memindahkan aktivasi tahun ajaran ke satu transaksi, memeriksa permission, mempertahankan RLS melalui SECURITY INVOKER, dan memakai advisory transaction lock.
- Tidak ditemukan perintah penghapusan tabel/data massal pada empat migrasi yang ditinjau. Ini bukan bukti migrasi dapat dieksekusi atau seluruh perilaku database benar; pengujian PostgreSQL tetap belum tersedia.
- Butir audit lanjutan: verifikasi dependensi extension `pg_trgm`/operator class `extensions.gin_trgm_ops` pada migrasi fondasi; uji hak akses fungsi `has_permission` dan grants tabel; uji RLS anon/tanpa permission; uji trigger status dan riwayat kelas; uji rollback RPC untuk target tidak ada; serta uji dua aktivasi bersamaan. Perlu fixture PostgreSQL terisolasi yang dapat dijalankan di GitHub Actions tanpa menggunakan project Supabase kedua.
- Status migrasi 2600, 2700, dan 2800 pada production tidak dikonfirmasi ulang dalam sesi ini. Jangan menjalankan `db push`, SQL Editor, atau tes mutasi ke production.
- Konfirmasi pengguna sebelumnya tetap berlaku: `pnpm typecheck`, `pnpm lint`, `pnpm test`, dan `pnpm cf:build` hijau untuk kode saat itu. Tidak ada tes PostgreSQL yang diklaim lulus.
- Langkah berikutnya: siapkan test harness PostgreSQL sementara berbasis GitHub Actions dengan skema/fungsi Supabase minimum yang eksplisit, lalu jalankan migrasi dan tes negatif/positif di runner terisolasi. Jangan menggunakan project Supabase kedua.

## 2026-11-25 — PostgreSQL migration test harness di GitHub Actions

- Menambahkan job CI `database-tests` dengan service PostgreSQL 17 sementara di runner GitHub Actions. Job ini tidak menggunakan secret, URL, kredensial, atau project Supabase mana pun.
- Menambahkan fixture minimum yang eksplisit untuk role `anon`, `authenticated`, `service_role`, schema `auth` dan `extensions`, `auth.uid()`, `has_permission()`, serta tabel referensi `users`, `departments`, dan `teachers`. Permission helper hanya simulasi untuk tes RLS pada database disposable, bukan pengganti implementasi RBAC produksi.
- Job menjalankan migrasi `20261124250000` sampai `20261124280000` secara berurutan, lalu menguji: extension/operator class `pg_trgm`; grant SELECT dan RLS siswa tanpa permission; pencatatan riwayat status; pemaksaan `assigned_by = auth.uid()`; riwayat penempatan/perpindahan kelas; penolakan siswa nonaktif dan kelas lintas tahun; perlindungan identitas/metadata penempatan; aktivasi tahun ajaran; rollback saat target tidak ditemukan; dan penolakan aktivasi tanpa `classes:update`.
- Menambahkan tes konkurensi dua sesi PostgreSQL yang bersaing mengaktifkan tahun ajaran berbeda; invariant yang diperiksa adalah tepat satu tahun aktif dan hasil akhir sesuai urutan lock.
- Tes berjalan hanya di service PostgreSQL ephemeral GitHub Actions dengan data dummy deterministik. Tidak ada perintah yang diarahkan ke Supabase production atau project Supabase kedua.
- Status: workflow dan skrip baru telah dikomit; hasil eksekusi GitHub Actions masih menunggu. Jangan menyatakan tes database lulus sebelum job `database-tests` benar-benar hijau.
- Catatan cakupan: fixture menguji empat migrasi siswa/kelas terbaru, bukan seluruh rangkaian migrasi aplikasi dan bukan replika penuh Supabase Auth/Storage. Jika job menemukan perbedaan kompatibilitas, perbaiki fixture/test berdasarkan log sebelum mengubah migrasi produksi.
- Review awal harness menemukan dan memperbaiki nama variabel PL/pgSQL yang berpotensi ambigu pada assertion riwayat kelas sebelum hasil CI dinilai.
- Perbaikan lanjutan harness: seluruh referensi ID penempatan pada assertion PL/pgSQL diselaraskan ke variabel lokal `v_enrollment_id`.

## 2026-11-25 — Perbaikan CI #244: permission pada tes konkurensi

- CI run #244 (`45503812792`) menunjukkan job `check` lulus seluruh tahap (lint, typecheck, test, build), dan seluruh assertion migrasi database lulus.
- Kegagalan terbatas pada `tests/database/concurrency.sh`: kedua sesi tes hanya diberi `classes:update`, padahal RPC `activate_academic_year` menargetkan baris `academic_years` yang tetap dilindungi policy SELECT `classes:view`.
- Memperbaiki kedua sesi tes agar menggunakan permission `classes:view,classes:update`. Tidak mengubah migrasi atau kode aplikasi; hanya memperbaiki konteks permission pada fixture pengujian agar sesuai dengan RLS.
- Belum mengklaim CI hijau; workflow baru harus menyelesaikan ulang job `database-tests` dan `check`.
- Perubahan hanya pada skrip tes dan dokumentasi. Tidak ada koneksi atau perubahan pada Supabase production maupun project Supabase kedua.

## 2026-11-25 — CI #245 hijau dan detail rombongan belajar

- GitHub Actions run #245 (`45504395360`) pada commit `5acd253aaa8863b9a5e2e50c31e64e8ec5c06f01` selesai dengan conclusion `success` untuk kedua job: `check` dan `database-tests`.
- Job `check`: dependency install, lint, typecheck, unit test, dan build berhasil.
- Job `database-tests`: bootstrap PostgreSQL 17 disposable, penerapan migrasi `20261124250000`–`20261124280000`, seluruh assertion database, dan tes konkurensi aktivasi tahun ajaran berhasil.
- Hasil ini membuktikan migrasi tersebut lolos pada fixture PostgreSQL terisolasi di CI; bukan bukti migrasi sudah diterapkan pada Supabase production. Fixture permission `has_permission()` tetap simulasi dan bukan replika penuh RBAC Supabase.
- Menambahkan halaman detail rombongan belajar `/admin/kelas/[id]`. Dari daftar kelas, nama kelas dapat dibuka untuk melihat tingkat, jurusan, wali kelas, tahun ajaran, serta roster siswa bila akun juga memiliki `students:view`.
- Halaman detail hanya membaca data; tidak menambah/mengubah data siswa atau kelas. Validasi ID, `classes:view`, dan pembatasan roster dengan `students:view` tetap diterapkan.
- Tidak ada migrasi database baru dan tidak ada koneksi/perubahan ke Supabase production maupun project Supabase kedua.
- Status verifikasi fitur detail: menunggu CI baru setelah commit. Pengujian browser/preview Worker belum dilakukan.
- Langkah berikutnya: tunggu CI perubahan detail kelas; setelah hijau, pengguna pull `main` dan verifikasi halaman `/admin/kelas` serta detail kelas di preview. Pengelolaan edit/hapus kelas, kapasitas, dan kenaikan kelas massal tetap belum termasuk.


## 2026-11-25 — CI #246 dan review tampilan detail kelas

- GitHub Actions run #246 (`45517565078`) pada commit `14c55c1357a39c6e09e707e8734c947863b8ffa8` selesai dengan conclusion `success`.
- Job `check` berhasil pada dependency install, lint, typecheck, unit test, dan build.
- Job `database-tests` berhasil pada bootstrap PostgreSQL disposable, penerapan migrasi `20261124250000`–`20261124280000`, seluruh assertion, serta tes konkurensi aktivasi tahun ajaran.
- Review statis halaman `/admin/kelas` dan `/admin/kelas/[id]`: tautan nama kelas menuju detail; detail menampilkan tingkat, jurusan, wali kelas, tahun ajaran/periode, dan roster; halaman dilindungi `classes:view`, sedangkan roster hanya dimuat dengan `students:view`.
- Review ini hanya inspeksi kode dan hasil CI. Tidak ada browser/preview Worker yang dijalankan, sehingga rendering aktual dan keberadaan record kelas `X TKJ 1` belum terverifikasi.
- Tidak ada perubahan kode, migrasi, atau data Supabase. Production dan project Supabase kedua tidak disentuh.
- Langkah verifikasi berikutnya: pengguna pull commit `14c55c1`, jalankan aplikasi/preview, buka `/admin/kelas`, cari kelas `X TKJ 1`, lalu buka detailnya. Uji akun dengan `classes:view + students:view` dan akun dengan `classes:view` tanpa `students:view`; kirim screenshot atau hasilnya untuk review tampilan responsif dan state kosong/permission.


## 2026-11-25 — Pemeriksaan push terbaru dan CI #247

- Pemeriksaan riwayat commit branch `main` pada 2026-11-25 menemukan head terbaru `d58ab308ae9bca5449019a0c626057b435312e4a` (`docs(progress): record CI 246 and class detail review`). Commit tersebut hanya mengubah `progress.md`; README tidak berubah.
- Pengguna mengonfirmasi CI #247 hijau. Pemeriksaan workflow run untuk commit head melalui konektor GitHub tidak mengembalikan run, sehingga status ini dicatat sebagai konfirmasi pengguna, bukan verifikasi independen; detail job/run ID belum tersedia.
- Pengguna menegaskan pada 2026-11-25 bahwa penerapan migrasi production `20261124260000`–`20261124280000` sudah selesai dan telah dipastikan 100% olehnya. Catat sebagai konfirmasi langsung pengguna; hasil verifikasi terbaru tidak ditempelkan kembali dalam percakapan, sehingga asisten tidak mengklaim telah memeriksa database secara independen. Jangan meminta pemeriksaan migrasi berulang tanpa alasan baru.
- Tidak ada perubahan kode, migrasi, konfigurasi, atau tindakan terhadap Supabase dalam pemeriksaan GitHub ini. Project Supabase kedua tidak disentuh.
- Langkah berikutnya: lanjutkan validasi fitur kelas melalui browser/preview Worker pada `/admin/kelas` dan `/admin/kelas/[id]`; periksa daftar tahun ajaran, daftar kelas, detail, roster sesuai permission, serta tampilan responsif. Setelah QA, rencanakan fitur lanjutan seperti edit/hapus kelas, kapasitas, dan kenaikan kelas massal.


## 2026-11-25 — Fitur edit rombongan belajar

- Menambahkan server action `updateClassGroup` dengan validasi Zod, pemeriksaan permission `classes:update`, verifikasi ID kelas, dan pembatasan agar tahun ajaran asal tidak dapat diganti melalui form edit.
- Perubahan yang dapat dilakukan: nama kelas, tingkat X/XI/XII, jurusan, dan wali kelas.
- Perubahan disimpan melalui Supabase dengan RLS tetap berlaku; konflik nama kelas ditangani sebagai pesan duplikat.
- Aktivitas perubahan dicatat ke activity log dan daftar/detail kelas direvalidasi.
- Menambahkan form edit pada halaman detail `/admin/kelas/[id]`; hanya akun dengan permission `classes:update` yang melihat form.
- Tidak ada migrasi database baru dan tidak ada perubahan data langsung di Supabase. Project production dan project Supabase kedua tidak disentuh oleh pekerjaan kode ini.
- Status verifikasi: perubahan belum dijalankan lokal; CI baru menunggu. Setelah CI hijau, uji edit nama/tingkat/jurusan/wali kelas, konflik nama, akun tanpa permission, dan tampilan mobile.


## 2026-11-25 — Kapasitas rombongan belajar dan pengaman penempatan siswa

- Menambahkan migrasi baru `20261124290000_class_capacity_enrollment_guard.sql`; migrasi lama tidak diubah.
- Setiap rombel memiliki kapasitas yang dapat diatur (default 36, rentang 1–60) dan counter penempatan yang dipelihara oleh trigger database.
- Penempatan baru dan perpindahan kelas memesan slot secara atomik melalui conditional UPDATE pada baris rombel. Permintaan bersamaan ke kelas yang sama diserialkan PostgreSQL sehingga kapasitas tidak dapat terlampaui.
- Trigger mengunci dua rombel secara berurutan saat transfer, mengurangi counter kelas asal setelah transfer/penghapusan, dan menolak penurunan kapasitas di bawah jumlah siswa yang sudah ditempatkan.
- Form tambah/edit rombel menerima dan menyimpan kapasitas; daftar kelas dan detail kelas menampilkan jumlah siswa dibanding kapasitas hanya bila akun memiliki permission `students:view`, sedangkan akun tanpa permission hanya melihat batas maksimum. Server action menerjemahkan penolakan kapasitas menjadi pesan yang dapat dipahami.
- Assertion tambahan memastikan counter tidak dapat dipalsukan melalui UPDATE langsung oleh klien.
- Fixture PostgreSQL disposable CI diperluas untuk menguji counter transfer, penolakan penempatan melebihi kapasitas, penolakan pengurangan kapasitas, serta dua penempatan bersamaan yang berebut satu slot.
- Tidak ada SQL yang dijalankan terhadap Supabase production dan tidak ada perubahan pada project Supabase kedua. Migrasi baru belum diterapkan ke database mana pun.
- Status verifikasi: menunggu CI untuk lint, typecheck, unit test, build, migrasi/assertion PostgreSQL, dan uji konkurensi kapasitas. Setelah CI hijau, pengguna pull commit dan uji UI tambah/edit kelas serta penempatan saat kelas penuh.


## 2026-11-25 — CI kapasitas hijau dan kenaikan kelas massal

- Pengguna mengonfirmasi seluruh pemeriksaan lokal untuk perubahan kapasitas rombel lolos.
- Verifikasi GitHub Actions: run #45529710606 pada commit 4b989dcc8f3dd421d481a799605754db8b2c424f dan run #45529628690 pada commit f01c88f45dd569d2e2c96b196daf0528e7a3e63c selesai success. Job check (lint, typecheck, unit test, build) dan database-tests (migrasi, assertion, tes konkurensi aktivasi tahun ajaran dan kapasitas) lulus.
- Menambahkan migrasi 20261124300000_bulk_class_promotion.sql untuk RPC promote_class_students, SECURITY INVOKER, pemeriksaan empat permission, validasi tahun ajaran berurutan, kelas asal X/XI dan target satu tingkat di atas, serta proses batch atomik.
- Kenaikan dilakukan per rombel: seluruh siswa berstatus aktif yang terdaftar di kelas asal dipindahkan ke kelas tujuan tahun ajaran berikutnya. Trigger kapasitas dan riwayat penempatan tetap berjalan; bila kapasitas tidak cukup, seluruh batch rollback.
- UI admin kelas menyediakan form kenaikan per kelas X/XI dan pilihan kelas tujuan pada tahun ajaran berikutnya. Kelas XII tidak dinaikkan otomatis karena harus melalui alur kelulusan terpisah.
- Assertion PostgreSQL ditambah untuk rollback saat kapasitas kurang, keberhasilan seluruh batch, riwayat, dan penolakan duplikasi. Runner memuat migrasi 3000 dan menyiapkan permission penuh pada sesi uji promosi.
- Urutan database: migrasi 20261124290000 harus diterapkan sebelum 20261124300000. Keduanya belum diterapkan ke Supabase production; jangan jalankan SQL production otomatis.
- Tidak ada perubahan atau koneksi pada project Supabase kedua.
- Status verifikasi fitur kenaikan massal: menunggu CI baru dan pengujian UI pengguna.


## 2026-11-25 — CI kenaikan kelas massal hijau

- GitHub Actions run #45533769210 pada commit `e584a3d9fb30e4d7b36b483700fa52648542bc93` selesai dengan conclusion `success`; job `check` dan `database-tests` keduanya lulus.
- Job `check` mencakup lint, typecheck, unit test, dan build. Job `database-tests` berhasil menerapkan migrasi pada PostgreSQL disposable dan menjalankan assertion, termasuk rollback batch saat kapasitas tidak cukup, promosi penuh beserta riwayat, serta penolakan promosi duplikat.
- Ini adalah verifikasi CI pada database disposable, bukan penerapan ke Supabase production. Migrasi `20261124290000_class_capacity_enrollment_guard.sql` dan `20261124300000_bulk_class_promotion.sql` tetap belum diterapkan ke production.
- Project Supabase Website Sekolah production dan project Supabase kedua tidak disentuh.
- Status fitur kenaikan kelas massal: CI hijau; menunggu pull dan uji UI oleh pengguna. Uji harus menggunakan tahun ajaran berikutnya dan kelas target yang kapasitasnya memadai; kelas XII tidak muncul sebagai kelas asal.
- Kandidat pekerjaan lanjutan setelah QA: alur kelulusan siswa kelas XII yang mengubah status siswa menjadi `graduated`, mengisi tanggal kelulusan, dan mempertahankan riwayat status. Aturan tanggal dan cakupan kelulusan perlu dipastikan sebelum implementasi.


## 2026-11-25 — Kelulusan massal siswa kelas XII

- Menambahkan migrasi baru `20261124310000_bulk_student_graduation.sql` dengan RPC `graduate_class_students` berkarakteristik SECURITY INVOKER. Fungsi memeriksa permission `classes:view`, `students:view`, `classes:update`, dan `students:update`; mengunci rombel serta tahun ajaran; hanya menerima kelas XII pada tahun ajaran aktif; lalu mengubah semua siswa aktif yang terdaftar menjadi `graduated` dan mengisi tanggal kelulusan dalam satu transaksi.
- Trigger `record_student_status_change` yang sudah ada mencatat perubahan status secara otomatis. Siswa yang bukan aktif tidak diubah. Pengulangan proses ketika tidak ada siswa aktif ditolak, dan kegagalan constraint membatalkan seluruh batch.
- Menambahkan validasi Zod dan server action yang menerapkan permission, memanggil RPC, mencatat activity log, serta merevalidasi halaman kelas dan siswa.
- Menambahkan bagian UI Kelulusan kelas XII di `/admin/kelas`, dengan daftar rombel XII pada tahun aktif, jumlah siswa aktif berdasarkan penempatan, dan input tanggal kelulusan per rombel. Bagian hanya tampil untuk akun dengan permission yang diperlukan.
- Runner database CI memuat migrasi 3100 dan assertion untuk penolakan permission, penolakan kelas non-XII, rollback penuh saat tanggal tidak valid pada salah satu siswa, kelulusan tiga siswa, penyimpanan tanggal, pencatatan tiga riwayat status, dan penolakan proses ulang.
- Migrasi 3100 belum diterapkan ke Supabase production. Urutan deployment untuk fitur kapasitas, kenaikan, dan kelulusan adalah 2900 → 3000 → 3100 setelah fondasi 2500–2800 yang sudah dikonfirmasi pengguna diterapkan. Project Supabase kedua tidak disentuh.
- Status verifikasi: menunggu GitHub Actions dan uji UI pengguna. Tidak ada klaim pengujian lokal.


### Catatan CI kelulusan — perbaikan fixture
- Run #45541329118: job `check` sukses, tetapi `database-tests` gagal saat menyiapkan fixture siswa karena test session tidak menyertakan permission `students:create`. Ini adalah kekurangan permission pada fixture CI, bukan hasil kegagalan RPC kelulusan.
- Memperbarui permission fixture untuk menyertakan `students:create` sebelum membuat tiga data calon lulusan. Commit perbaikan memicu CI ulang; status akhir belum diklaim sampai run terbaru selesai.

## 2026-11-25 — Perbaikan CI #260: delimiter blok kelulusan

- GitHub Actions run #45541600801 (CI #260) menunjukkan job `check` sukses, tetapi `database-tests` gagal saat parsing `tests/database/run.sql:349` dengan `syntax error at or near "$"`.
- Akar masalah: blok PL/pgSQL pengujian kelulusan massal memakai delimiter `do $` dan penutup `$;`, bukan pasangan dollar-quote `do $$` dan `$$;`. Memperbaiki kedua delimiter tanpa mengubah assertion atau migrasi.
- Job `check` pada run tersebut tetap sukses; database-tests harus dijalankan ulang pada commit perbaikan sebelum fitur dinyatakan lolos CI.
- Perubahan hanya pada runner pengujian dan dokumentasi. Tidak ada migrasi yang diterapkan ke Supabase production; project Supabase kedua tidak disentuh.

## 2026-11-25 — Koreksi delimiter tes kelulusan setelah CI #261

- CI #261 (run `45544507071`) masih gagal pada `tests/database/run.sql:349` dengan `syntax error at or near "$"`. Inspeksi file branch menunjukkan blok PL/pgSQL kelulusan masih menggunakan pembuka `do $` dan penutup `$;`.
- Mengganti delimiter khusus blok kelulusan menjadi pasangan `do $$` dan `$$;`, lalu memverifikasi pembuka dan penutup baru pada konten sebelum commit.
- Job `check` CI #261 sukses; database-tests masih gagal sampai workflow baru menyelesaikan seluruh assertion.
- Tidak ada migrasi yang diterapkan ke Supabase production dan project Supabase kedua tidak disentuh.


## 2026-11-25 — CI #262 kelulusan massal hijau

- GitHub Actions run #262 (`45545066948`) pada commit `c2765514f141cef1853172deaec34398043533f1` selesai dengan conclusion `success`.
- Run ini memvalidasi job pemeriksaan aplikasi dan database-tests; koreksi delimiter PL/pgSQL pada blok uji kelulusan sudah lolos.
- Migrasi `20261124290000_class_capacity_enrollment_guard.sql`, `20261124300000_bulk_class_promotion.sql`, dan `20261124310000_bulk_student_graduation.sql` tetap belum diterapkan ke Supabase production. CI menggunakan PostgreSQL disposable.
- Belum ada klaim pengujian UI/browser lokal. Setelah pull, pengguna tetap perlu menguji form kelulusan kelas XII, tanggal, hasil status, dan riwayat sebelum deployment database.
- Project Supabase Website Sekolah production maupun project Supabase kedua tidak disentuh.


## 2026-11-25 — Pengamanan privasi dan penempatan siswa individual

- Audit halaman `/admin/kelas` menemukan query data induk siswa dan roster penempatan dijalankan tanpa memeriksa `students:view`, sementara tabel roster juga dirender untuk semua akun dengan `classes:view`. Memperbaiki agar query siswa/roster hanya dijalankan dan ditampilkan bila akun memiliki `students:view`.
- Form penempatan individual sekarang hanya tersedia dalam area yang dilindungi `students:view`; server action juga memeriksa `classes:view`, `classes:update`, `students:view`, dan `students:update` sehingga tidak bergantung pada visibilitas UI.
- Server action memverifikasi bahwa kelas tujuan berada pada tahun ajaran aktif, menolak pemilihan kelas yang sama dengan penempatan saat ini, serta menampilkan pesan sukses/error khusus penempatan.
- Perubahan hanya pada halaman admin dan server action serta dokumentasi. Tidak ada perubahan migrasi atau data Supabase; migrasi 2900–3100 tetap belum diterapkan ke production dan project Supabase kedua tidak disentuh.
- Status verifikasi: menunggu CI; belum ada klaim uji browser/local.


## 2026-11-25 — CI #264 hijau dan keputusan deployment database

- GitHub Actions run #264 (`45546928971`) pada commit `97bc9b619561201d43c59395555da6956056c435` selesai dengan conclusion `success`; job `check` dan `database-tests` keduanya hijau.
- Job `check` meliputi install dependency, lint, typecheck, unit test, dan build. Job `database-tests` berhasil menjalankan migrasi serta assertion PostgreSQL disposable, termasuk tes konkurensi kapasitas kelas.
- Hasil CI memverifikasi kode dan migrasi dalam lingkungan tes terisolasi; bukan penerapan atau verifikasi langsung pada Supabase production.
- Audit ulang status deployment: migrasi `20261124290000_class_capacity_enrollment_guard.sql`, `20261124300000_bulk_class_promotion.sql`, dan `20261124310000_bulk_student_graduation.sql` masih pending di production. Fondasi 2500–2800 sebelumnya telah dikonfirmasi pengguna diterapkan.
- Tidak menerapkan migrasi production pada sesi ini. Sebelum deployment, pengguna perlu menyelesaikan smoke test UI (kapasitas, penempatan dengan/tanpa `students:view`, kenaikan massal, dan kelulusan kelas XII), memastikan backup production tersedia, lalu memeriksa `supabase migration list --remote` pada project Website Sekolah yang benar. Jangan menyentuh project Supabase kedua.
- Jika riwayat remote menunjukkan hanya migrasi 2900–3100 yang tertunda dan backup sudah dipastikan, jalankan penerapan berurutan 2900 → 3000 → 3100, lalu verifikasi ulang daftar migrasi remote dan alur aplikasi. Hentikan bila ada versi tak dikenal atau ketidaksesuaian riwayat.
- Belum ada pengujian browser/local yang diklaim dan tidak ada SQL yang dijalankan terhadap Supabase production.


## 2026-11-25 — Pengamanan perubahan status melalui form data induk

- Audit alur CRUD siswa menemukan form umum tambah/edit mengizinkan pemilihan status `active`, `graduated`, `transferred`, atau `withdrawn` dan pengisian tanggal kelulusan secara langsung.
- Ini berpotensi melewati aturan proses akademik khusus, misalnya kelulusan massal yang hanya boleh dilakukan untuk rombel XII pada tahun ajaran aktif, serta membuat status/tanggal kelulusan tidak sinkron dengan riwayat.
- Form umum sekarang hanya mengelola data induk. Siswa baru selalu dibuat dengan status `active` dan `graduation_date = null`; saat edit, server action tidak mengirim kolom status/tanggal kelulusan sehingga nilai lifecycle yang sudah ada tetap dipertahankan.
- Menghapus field status dan tanggal kelulusan dari schema/form generik. UI memberi keterangan bahwa perubahan status harus melalui proses akademik khusus. Detail siswa tetap menampilkan status dan tanggal kelulusan.
- Perubahan ini tidak mengubah migrasi atau database production. Proses khusus untuk status `transferred` dan `withdrawn` masih perlu dirancang terpisah; fitur kelulusan XII tetap memakai RPC khusus.
- Status verifikasi: menunggu CI dan uji pengguna. Tidak ada pengujian lokal yang diklaim; tidak ada project Supabase yang disentuh.

## 2026-11-25 — Perbaikan CI #266: test schema lifecycle siswa

- GitHub Actions run #45548734154 (CI #266) gagal hanya pada job `check`, langkah `pnpm test`; job `database-tests` berhasil.
- Log menunjukkan satu unit test lama di `tests/unit/student-schema.test.ts` masih mengharapkan schema form data induk menolak tanggal kelulusan sebelum tanggal lahir.
- Ekspektasi tersebut sudah tidak sesuai dengan desain terbaru: `status` dan `graduation_date` sengaja dikeluarkan dari schema umum agar perubahan lifecycle hanya melalui alur akademik khusus. Zod mengabaikan properti asing secara default.
- Memperbarui unit test agar memverifikasi bahwa payload legacy yang memuat status/tanggal kelulusan tidak menyebabkan schema umum gagal dan kedua properti tersebut tidak masuk ke hasil parse.
- Tidak mengembalikan field lifecycle ke form umum, tidak mengubah migrasi/database, dan tidak menyentuh Supabase production maupun project kedua.
- Status verifikasi: perubahan test dan dokumentasi didorong ke branch `main`; menunggu CI baru. Jangan menyatakan CI hijau sebelum run baru selesai.

## 2026-11-25 — Pengamanan lifecycle siswa pada batas privilege database

- Audit setelah CI #267 hijau menemukan bahwa migrasi fondasi masih memberikan privilege tabel-level `INSERT` dan `UPDATE` kepada role `authenticated`. Menghapus field status dari form/server action belum cukup: klien Supabase langsung masih dapat mencoba mengirim `status` atau `graduation_date`.
- Menambahkan migrasi baru `20261124320000_student_lifecycle_column_guards.sql`: mencabut privilege tabel-level INSERT/UPDATE, lalu memberi privilege kolom hanya untuk data induk; kolom `status`, `graduation_date`, `created_by`, dan `updated_by` tidak dapat ditulis langsung oleh role authenticated.
- Trigger audit baru menetapkan `created_by` / `updated_by` dari `auth.uid()`. Form/server action tidak lagi mengirim field audit maupun lifecycle; status awal menggunakan default database `active`.
- RPC kelulusan kelas XII diubah menjadi SECURITY DEFINER dengan `search_path = ''`, tetap memeriksa empat permission dan aturan kelas XII/tahun ajaran aktif sebelum mengubah status/tanggal. Ini diperlukan karena SECURITY INVOKER tidak dapat melewati pembatasan kolom baru. Eksekusi hanya diberikan kepada authenticated.
- Runner PostgreSQL disposable menambahkan migrasi 3200 dan assertion bahwa insert/update lifecycle langsung ditolak, insert siswa tetap default aktif, metadata actor dipercaya dari JWT, dan trigger riwayat tetap berjalan; skenario kelulusan tetap menguji RPC khusus.
- Memperbarui keterangan halaman edit agar sesuai dengan alur lifecycle khusus.
- Tidak ada migrasi yang diterapkan ke Supabase production dan project Supabase kedua tidak disentuh. Urutan deployment kini 2900 → 3000 → 3100 → 3200 setelah fondasi 2500–2800.
- Status verifikasi: menunggu CI. SECURITY DEFINER RPC dan perubahan privilege harus lulus seluruh database-tests sebelum dianggap siap.


## 2026-11-25 — Perbaikan CI #268: privilege kolom ID siswa

- GitHub Actions run #268 (`45555596174`) pada commit `05c45e20a647279c2175ba82d57f0b8b2156a89f` gagal hanya pada job `database-tests`; job `check` sukses.
- Log PostgreSQL menunjukkan fixture uji langkah 5 gagal saat melakukan INSERT siswa dengan ID eksplisit: privilege INSERT kolom `id` belum diberikan setelah privilege tabel-level dicabut.
- Memperbaiki migrasi `20261124320000_student_lifecycle_column_guards.sql` dengan memberikan privilege INSERT kolom `id` kepada role authenticated. Kolom lifecycle (`status`, `graduation_date`) dan audit (`created_by`, `updated_by`) tetap tidak dapat ditulis langsung; privilege UPDATE untuk `id` juga tetap tidak diberikan.
- Perbaikan mempertahankan pembatasan lifecycle di database dan mendukung fixture serta klien yang menentukan UUID saat INSERT. Tidak mengubah RPC kelulusan atau kebijakan RLS.
- Belum ada klaim CI ulang berhasil sampai workflow pada commit perbaikan selesai. Migrasi 3200 tetap belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


## 2026-11-25 — Mutasi siswa: pindah dan mengundurkan diri

- Pengguna mengonfirmasi aturan domain: ketika siswa pindah atau mengundurkan diri, penempatan kelas pada tahun ajaran aktif harus ditutup otomatis, kapasitas kelas dibebaskan, dan riwayat penempatan lama tetap disimpan.
- Baseline GitHub Actions CI #269 pada commit `79c27dcdac1526f0fa9b35f98c0dab2cbd11063c` dikonfirmasi hijau oleh pengguna.
- Menambahkan migrasi baru `20261124330000_student_transfer_withdrawal.sql`: kolom `ended_at` dan `ended_by` pada enrollment; pembatasan privilege agar klien authenticated tidak dapat menutup atau mengubah metadata penutupan secara langsung; trigger counter membebaskan slot saat penempatan ditutup; RPC `transition_student_status` memeriksa permission dan mengubah status serta menutup enrollment tahun ajaran aktif dalam satu transaksi.
- Enrollment dan `student_class_history` tidak dihapus. Baris penempatan ditandai berakhir sehingga histori tetap dapat ditelusuri. Penutupan hanya menyasar penempatan pada tahun ajaran aktif; penempatan tahun ajaran sebelumnya tidak diubah.
- Menambahkan server action dan kontrol pada detail siswa untuk status `transferred` dan `withdrawn`; perubahan status tetap tidak tersedia pada form data induk.
- Daftar roster kelas dan penempatan tahun ajaran aktif hanya menampilkan enrollment yang belum ditutup. Server action perpindahan kelas tidak lagi mengirim metadata audit yang dilindungi.
- Runner PostgreSQL disposable ditambah assertion privilege, transfer, withdrawal, pengurangan counter kapasitas, dan retensi riwayat penempatan/status.
- Status verifikasi implementasi: menunggu CI. Tes lokal tidak dijalankan oleh asisten. Migrasi 3300 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh. Jangan menjalankan migrasi production tanpa persetujuan eksplisit, backup, dan pemeriksaan urutan.


### Catatan verifikasi awal migrasi mutasi siswa

- CI #271 menunjukkan bahwa penggantian trigger guard awal belum mempertahankan reservasi kapasitas kelas tujuan saat perpindahan kelas biasa. Job aplikasi (lint, typecheck, unit test, build) lolos; database-tests berhenti pada assertion counter perpindahan.
- Memulihkan mekanisme reservasi slot atomik dan penguncian rombel dari migrasi kapasitas 2900 di dalam trigger guard baru, sambil tetap menambahkan validasi penutupan enrollment. Koreksi ini mempertahankan perilaku perpindahan kelas yang sudah ada.
- CI #272 dan #273 gagal pada revisi sebelum koreksi trigger kapasitas; hasil dan perbaikannya dicatat pada bagian verifikasi akhir di bawah.


### Verifikasi akhir mutasi siswa — CI #274 hijau

- GitHub Actions run #274 (`45562790576`) pada commit `896c10f647c44a2dc8cc29628425176c9fa71550` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test, dan build seluruhnya sukses.
- Job `database-tests`: seluruh migrasi dan assertion PostgreSQL sukses, termasuk tes transfer dan pengunduran diri, privilege penutupan enrollment, pelepasan kapasitas, retensi riwayat, konkurensi aktivasi tahun ajaran, serta konkurensi kapasitas kelas.
- Kegagalan database-tests pada CI #271–#273 menjadi umpan balik iteratif: #271/#272/#273 menangkap bahwa trigger guard mutasi harus tetap mempertahankan reservasi kapasitas saat perpindahan kelas biasa; koreksi di commit `896c10f` mengembalikan mekanisme lock dan reservasi atomik. CI #274 memvalidasi koreksi tersebut.
- Status fitur mutasi siswa: CI hijau. Uji UI/browser oleh pengguna masih diperlukan setelah pull.
- Migrasi `20261124330000_student_transfer_withdrawal.sql` belum diterapkan ke Supabase production. Penerapan production tidak dilakukan oleh asisten; project Supabase kedua tidak disentuh. Ikuti urutan migrasi yang tercatat dan lakukan backup serta verifikasi target sebelum deployment dengan persetujuan eksplisit pengguna.

## 2026-11-25 — Verifikasi browser mutasi siswa: transfer berhasil

- Pengguna mengonfirmasi ada perubahan/migrasi yang sebelumnya belum di-push; setelah melakukan push, pengujian melalui browser diterima sistem.
- Pengguna berhasil mengubah status seorang siswa menjadi `transferred` melalui alur detail siswa. Ini mengonfirmasi jalur UI → server action → RPC `transition_student_status` dapat dijalankan pada environment yang diuji.
- Hasil ini melengkapi CI #274 yang sebelumnya hijau untuk lint, typecheck, unit test, build, dan database-tests termasuk transfer/withdrawal, pelepasan kapasitas, serta retensi riwayat.
- Pengujian browser yang dikonfirmasi secara eksplisit baru mencakup status `transferred`; alur `withdrawn` belum dikonfirmasi oleh pengguna.
- Status penerapan migration: pengguna melaporkan push yang tertinggal telah dilakukan dan alur transfer browser berhasil. Asisten tidak menjalankan atau mengubah database production.
- Project Supabase kedua tidak disentuh.



## 2026-11-25 — Fondasi onboarding akun Portal Siswa

- Keputusan produk: dua jalur berjalan berdampingan, yaitu undangan yang dibuat admin untuk satu data siswa dan pendaftaran mandiri yang wajib diverifikasi admin.
- Menambahkan migrasi `20261124340000_student_portal_account_onboarding.sql`: relasi satu-ke-satu akun Auth ↔ data siswa, antrean pendaftaran mandiri, undangan sekali pakai dengan token acak 256-bit yang disimpan sebagai hash SHA-256, role terbatas `siswa`, serta permission `student_portal:view`.
- Pembuatan undangan mensyaratkan `students:view` dan `students:update`, hanya untuk siswa aktif tanpa akun portal, dan token berlaku tujuh hari. Token mentah hanya dikembalikan saat RPC membuat undangan; database hanya menyimpan hash.
- Klaim undangan menghubungkan akun Auth yang sudah dibuat, mengaktifkan profil, dan memberikan role siswa secara atomik. Pendaftaran mandiri tetap nonaktif tanpa role sampai admin menyetujui; persetujuan mencocokkan NIS, nama, tanggal lahir, dan status siswa aktif secara persis.
- Fungsi profil Portal Siswa hanya mengembalikan nama, NIS/NISN, status, tahun masuk, jurusan, kelas, dan tahun ajaran; tidak membuka alamat, tanggal lahir, telepon wali, atau catatan internal. Tidak ada policy SELECT umum untuk tabel students bagi role siswa.
- Pengujian PostgreSQL disposable ditambah untuk klaim undangan, aktivasi tertunda pendaftaran mandiri, pencocokan data saat approval, role terbatas, larangan direct write, dan pembatasan kolom profil.
- Tahap ini baru fondasi database/RPC. UI pendaftaran, halaman antrean admin, undangan dari detail siswa, login routing khusus siswa, dan dashboard Portal Siswa belum dibuat.
- Migrasi baru belum diterapkan oleh asisten ke Supabase production. Jangan jalankan migration push sebelum backup, pemeriksaan urutan remote, dan persetujuan eksplisit. Project Supabase kedua tidak disentuh.
- Verifikasi CI untuk commit ini menunggu hasil GitHub Actions; belum ada klaim tes lokal.


### Catatan CI #277 — penyesuaian skema fixture dan assertion onboarding

- Database-tests CI #277 menemukan kolom `departments.name` tidak ada pada fixture minimal; skema production memang memiliki kolom tersebut. Fixture diperbarui agar fungsi profil dapat dikompilasi.
- Memisahkan assertion administratif dari role `authenticated`; tes kini tetap memanggil RPC pada role yang sesuai, tetapi membaca tabel internal untuk assertion setelah reset role database.
- Menghapus undangan lama yang belum diklaim sebelum menerbitkan token baru untuk siswa yang sama, sehingga indeks unik undangan aktif tidak menghalangi penerbitan ulang.
- CI #277 database-tests gagal pada tahap pembuatan fungsi profil; tidak ada klaim kelulusan CI. Koreksi dikirim sebagai commit baru dan menunggu run berikutnya.


## 2026-11-25 — Alur autentikasi Portal Siswa

- Menambahkan validasi pendaftaran Portal Siswa: email, password minimal delapan karakter, nama, serta NIS/tanggal lahir untuk jalur mandiri atau token 64 karakter untuk jalur undangan.
- Server action menggunakan Supabase Auth sign-up. Metadata onboarding diproses setelah sesi tersedia; bila konfirmasi email diaktifkan, pemrosesan ditunda sampai login pertama setelah verifikasi email.
- Login memproses klaim undangan atau pengajuan mandiri yang tertunda, lalu mengarahkan role `siswa` ke `/portal`; akun tanpa role tetap ditolak dan di-sign-out.
- Pemisahan guard server: `requireAdmin` tidak menerima role siswa, sedangkan `requireStudent` hanya menerima role siswa.
- UI halaman pendaftaran, antrean verifikasi admin, undangan detail siswa, dan dashboard Portal Siswa akan ditambahkan pada commit lanjutan. CI untuk perubahan autentikasi ini menunggu workflow baru.
- Migrasi 3400 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


## 2026-11-25 — UI onboarding dan dashboard awal Portal Siswa

- Menambahkan halaman `/portal/daftar` dengan dua jalur: pendaftaran memakai kode undangan admin atau pendaftaran mandiri memakai nama, NIS, tanggal lahir, email, dan password.
- Menambahkan halaman `/portal/menunggu` untuk status pengajuan mandiri yang belum disetujui.
- Menambahkan dashboard awal `/portal` melalui RPC profil terbatas; role siswa tidak membaca langsung tabel privat `students`.
- Menambahkan halaman admin `/admin/akses-siswa` untuk meninjau, menyetujui, atau menolak pengajuan. Approval mensyaratkan NIS, nama, tanggal lahir, dan status siswa aktif cocok persis.
- Detail siswa menyediakan pembuatan token undangan sekali pakai; token hanya ditampilkan kepada admin saat dibuat dan harus dibagikan secara pribadi.
- Jalur undangan adalah undangan admin, bukan pembuatan password/Auth user secara langsung. Siswa menetapkan password sendiri. Pembuatan Auth user langsung oleh admin memerlukan Auth Admin API secret terpisah yang belum dikonfigurasi dan tidak ditambahkan.
- UI dan auth flow menunggu CI baru serta uji browser pengguna. Migrasi 3400 belum diterapkan ke Supabase production; project Supabase kedua tidak disentuh.


### Catatan validasi UI Portal Siswa

- Menambahkan unit test schema pendaftaran untuk kedua jalur (token undangan dan mandiri), format token, tanggal kalender, email, serta panjang password.
- Memperbaiki pola validasi tanggal agar memeriksa digit tahun/bulan/hari dengan benar.
- Perubahan UI Portal Siswa di commit sebelumnya menunggu hasil CI; verifikasi browser belum dilakukan.


### Koreksi pola tanggal pada schema pendaftaran

- Review kode setelah penambahan unit test menemukan pola tanggal tersimpan dengan escape ganda sehingga regex tidak mengenali digit tanggal.
- Mengoreksi pola menjadi digit regex standar dan mempertahankan validasi kalender ISO.
- Unit test baru akan memverifikasi koreksi ini pada CI berikutnya.


### Catatan CI #280 — tipe activity action

- CI #280 pada commit `4c0544ef`: lint sukses, database-tests sukses, tetapi typecheck gagal karena union `ActivityAction` tidak memiliki nilai `approve` dan `reject`.
- Menggunakan action `verify` yang memang tersedia pada tipe activity log untuk kedua keputusan verifikasi; ringkasan log tetap membedakan persetujuan dan penolakan.
- CI #281/#282 akan memverifikasi koreksi ini beserta validasi tanggal pendaftaran yang diperbaiki.


## Verifikasi akhir onboarding Portal Siswa — CI #283 hijau

- GitHub Actions run #283 (`45566247613`) pada commit `93402b9aa5c0762ec825dc6d7def7cfc7f3285c4` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test (termasuk schema pendaftaran Portal Siswa), dan build seluruhnya sukses.
- Job `database-tests`: migrasi 2500–3400 serta seluruh assertion onboarding lulus; tes konkurensi aktivasi tahun ajaran dan kapasitas kelas juga sukses.
- Perbaikan yang ditangkap CI selama iterasi: fixture jurusan harus menyertakan `departments.name`; delimiter PL/pgSQL dan assertion role database disesuaikan; activity log menggunakan enum `verify`; regex tanggal pendaftaran diperbaiki.
- Fitur onboarding dan dashboard awal sudah tersedia di branch `main`; belum ada uji browser yang dikonfirmasi untuk alur Portal Siswa.
- Migrasi `20261124340000_student_portal_account_onboarding.sql` belum diterapkan oleh asisten ke Supabase production. Lakukan pemeriksaan migration list remote, backup, dan persetujuan sebelum deployment. Project Supabase kedua tidak disentuh.
- Uji browser berikutnya: buat undangan dari detail siswa aktif, daftar menggunakan token, login ke `/portal`; lalu uji pendaftaran mandiri, pastikan akun tetap tertahan, setujui di `/admin/akses-siswa`, dan login kembali. Uji juga token kedaluwarsa/salah, data identitas tidak cocok, serta akun siswa yang sudah terhubung.

## 2026-11-25 — Hardening status akun Portal Siswa (migrasi 3500)

- Review sebelum deployment menemukan bahwa RPC klaim undangan dan approval pendaftaran belum secara eksplisit memverifikasi status akun `public.users` saat proses aktivasi.
- Menambahkan migrasi baru `20261124350000_student_portal_onboarding_account_state_guard.sql`; migrasi 3400 tidak diubah agar tetap immutable.
- `claim_student_portal_invitation` kini mengunci row akun dan hanya menerima akun yang masih `is_active = false` serta `deleted_at IS NULL`. Pemeriksaan dilakukan sebelum token dikonsumsi atau relasi akun dibuat.
- `approve_student_portal_registration` menerapkan pemeriksaan yang sama setelah mengunci request dan row akun, sebelum penautan siswa.
- Menambahkan assertion database untuk menolak klaim undangan dari akun aktif dan menolak approval jika akun menjadi aktif setelah pendaftaran. Pengujian memastikan token tidak dikonsumsi, relasi tidak dibuat, dan request tetap pending.
- `tests/database/run.sql` menerapkan migrasi 3500 setelah 3400 dan menjalankan skenario regresi tambahan.
- Perubahan disiapkan pada branch `main`; CI wajib hijau sebelum deployment. Belum ada migrasi yang diterapkan ke Supabase production.
- Backup gratis dibuat pengguna pada 2026-11-25: `web-sekolah-20261125-before-student-portal.dump`, ukuran 550 KB, TOC 789 entri, SHA-256 `c146afa3c7e4a46f154dae19d98ae3a7160b5606b5d2982fefccf15ff170d20b`. Arsip berhasil dibaca `pg_restore --list`; full restore belum diuji. Pastikan permission file `600` sebelum deployment.
- Target deployment tetap hanya Supabase Website Sekolah `nofznzznzjsvnkrmzpwx`. Jangan menyentuh project Supabase kedua.

### Hasil CI #286 — hardening Portal Siswa

- GitHub Actions run #286 (`45569059580`) pada commit `30f818ff0a46f2667244cf54eede4dca397c96e7` selesai dengan conclusion `success`.
- Job `check`: lint, typecheck, unit test, dan build seluruhnya sukses.
- Job `database-tests`: migrasi 2500–3500, assertion onboarding, penolakan akun Auth yang sudah aktif, serta tes konkurensi aktivasi tahun ajaran dan kapasitas kelas seluruhnya sukses.
- Hasil ini hanya memverifikasi CI pada database fixture terisolasi. Migrasi 3400 dan 3500 belum diterapkan ke Supabase production; jangan jalankan `db push` sebelum migration list remote, pemeriksaan backup/permission, dan persetujuan deployment.


## 2026-11-25 — Pemulihan migrasi hardening Portal Siswa

- Pemeriksaan setelah pengguna menjalankan `git pull origin main` menemukan commit dokumentasi `9435460c9c91ae08104c6a96a25f36855240ae23` secara tidak sengaja menghapus file migrasi `20261124350000_student_portal_onboarding_account_state_guard.sql` dan 81 baris assertion hardening dari `tests/database/run.sql`.
- Memulihkan migrasi 3500 dan runner database lengkap dari commit tervalidasi sebelumnya `30f818ff0a46f2667244cf54eede4dca397c96e7`; migrasi 3400 tetap tidak diubah.
- CI #286 memang hijau pada commit sebelum penghapusan, tetapi tidak memvalidasi keadaan branch setelah penghapusan. CI wajib dijalankan ulang pada commit pemulihan sebelum deployment.
- Pemeriksaan Supabase production menunjukkan migrasi 3400 belum diterapkan; 3500 tidak tercantum di remote karena belum ada di repository lokal/branch saat pemeriksaan. Backup pengguna berukuran 562.928 byte dengan permission `600`.
- Tidak ada `db push`, perubahan database production, atau perubahan pada project Supabase kedua. Deployment tetap menunggu CI baru dan persetujuan eksplisit pengguna.


## 2026-11-25 — Mempermudah akses publik pendaftaran Portal Siswa

- Audit repository memastikan halaman publik `/portal/daftar` dan formulir pendaftaran dua jalur (kode undangan atau mandiri) sebenarnya sudah tersedia; tautan pendaftaran juga sudah ada di formulir login.
- Temuan UX: halaman pendaftaran belum cukup terlihat dari website publik, sehingga pengunjung dapat mengira formulir belum tersedia.
- Menambahkan tautan **Portal Siswa** pada header desktop dan CTA **Daftar Portal Siswa** pada hero beranda agar siswa/orang tua dapat menemukan formulir tanpa harus membuka halaman login terlebih dahulu.
- Route pendaftaran tetap menggunakan halaman yang sama; tidak membuat formulir atau endpoint duplikat. Jalur mandiri tetap memerlukan persetujuan admin sebelum akun diaktifkan.
- Perubahan ini hanya pada navigasi/penemuan halaman publik. Tidak mengubah skema database, migrasi, atau data production.
- CI untuk commit navigasi ini menunggu hasil GitHub Actions; browser QA publik masih perlu dilakukan setelah deployment aplikasi.


## 2026-11-25 — Perbaikan pendaftaran Portal Siswa dan persetujuan daftar mandiri

- Audit alur browser menunjukkan pesan `Pendaftaran akun gagal. Periksa email dan password...` berasal dari kegagalan `supabase.auth.signUp()`, sebelum RPC pencocokan NIS/nama/tanggal lahir dijalankan. Jadi pesan tersebut tidak membuktikan bahwa data siswa di database tidak cocok.
- Mengganti pesan generik untuk kegagalan Auth dengan penjelasan berdasarkan kode error yang aman ditampilkan (email sudah terdaftar, format email, password lemah, pembatasan percobaan, signup dinonaktifkan, dan kegagalan pembuatan profil database). Log server hanya mencatat kode/status, bukan email atau password.
- Menambahkan persetujuan eksplisit pada jalur daftar mandiri. Field NIS dan tanggal lahir terkunci sampai checkbox dicentang; validasi server juga menolak permohonan daftar mandiri tanpa nilai persetujuan, sehingga tidak hanya mengandalkan kontrol browser.
- Jalur kode undangan tetap dapat digunakan tanpa checkbox daftar mandiri.
- Memperbarui unit test schema untuk memastikan persetujuan wajib pada daftar mandiri dan tidak diwajibkan untuk jalur undangan.
- Tidak mengubah migrasi atau database production. Belum ada klaim CI/lint/typecheck sampai workflow commit ini selesai.


## 2026-11-25 — Perbaikan regresi unit test pendaftaran Portal Siswa

- CI #290 (`45607411790`) gagal hanya pada satu unit test: `studentPortalSignupSchema` menolak tanggal lahir valid `2010-01-15`.
- Akar masalah: regex validasi tanggal di `src/features/auth/schema.ts` memiliki escaping berlebih (`\\d` pada source), sehingga mencari karakter literal backslash dan huruf d, bukan digit tanggal.
- Memperbaiki regex menjadi digit matcher TypeScript yang benar (`\d`) dan mempertahankan pemeriksaan tanggal kalender agar tanggal seperti 30 Februari tetap ditolak.
- Database tests pada CI #290 sukses; lint dan typecheck juga sukses. Unit test dan build harus dijalankan ulang pada commit perbaikan ini.
- Tidak ada perubahan migrasi atau database production.


## 2026-11-25 — Perbaikan konfirmasi email dan antrean verifikasi Portal Siswa

- Audit laporan redirect menemukan aksi `signUp()` belum mengirim `emailRedirectTo`, sehingga Supabase memakai Site URL proyek (yang saat ini mengarah ke `localhost:3000`). Pendaftaran kini mengarahkan email konfirmasi ke origin website yang sedang diakses dan endpoint aplikasi `/auth/callback`.
- Menambahkan callback server `src/app/auth/callback/route.ts` untuk menukar authorization code menjadi sesi, memproses metadata pendaftaran setelah email terkonfirmasi, menyimpan permohonan melalui RPC `submit_student_portal_registration`, lalu mengeluarkan akun dan mengarahkan pendaftar ke halaman menunggu verifikasi. Jalur undangan juga diklaim setelah konfirmasi.
- Mempertahankan fallback pada proses login untuk akun lama yang metadata pendaftarannya belum sempat diproses.
- Temuan navigasi admin: halaman `/admin/akses-siswa` dan action persetujuan sebenarnya sudah ada, tetapi route tersebut tidak dimasukkan ke daftar route aktif dan tidak memiliki item navigasi. Menambahkan menu **Verifikasi Portal Siswa** dengan permission `students:view`, sehingga antrean pendaftaran dapat ditemukan admin.
- Antrean ini memang terpisah dari `/admin/siswa`: data induk siswa tidak dibuat ulang. Admin memverifikasi dan menautkan akun pendaftar ke siswa aktif yang sudah ada.
- Tidak mengubah migrasi, skema, atau database production. Konfigurasi Supabase Auth URL Configuration tetap harus mengizinkan domain production dengan path callback `/auth/callback`; Site URL sebaiknya disetel ke domain production agar tautan fallback tidak memakai localhost.
- CI #291 untuk perbaikan regex sebelumnya selesai dengan status sukses. Status CI perubahan callback dan navigasi ini menunggu workflow commit terbaru.


## 2026-11-25 — Visibilitas Portal Siswa pada navigasi publik

- Menambahkan Portal Siswa ke daftar navigasi publik di dekat Beranda agar tampil pada menu desktop, dropdown, dan menu mobile.
- Menonjolkan tautan Portal Siswa dengan warna amber pada menu desktop dan mobile; tautan penting di footer juga ditambahkan.
- Menghapus tombol Portal Siswa terpisah pada header agar tidak ada duplikasi tautan.
- Tidak mengubah migrasi atau database production. CI untuk perubahan ini menunggu workflow commit terbaru.


## 2026-11-25 — Pengiriman ulang email konfirmasi Portal Siswa

- Menambahkan aksi server untuk meminta ulang email konfirmasi melalui Supabase Auth resend dengan tipe signup. URL callback memakai host website yang sedang diakses agar tautan kembali ke domain website, bukan localhost.
- Menambahkan formulir Email konfirmasi belum masuk pada halaman pendaftaran. Pendaftar dapat meminta tautan baru tanpa mencoba membuat akun ulang; UI menampilkan pesan untuk pembatasan laju dan akun yang sudah terkonfirmasi.
- Pengiriman ulang tidak membuat akun baru. Fitur ini hanya ditujukan bagi akun yang masih menunggu konfirmasi; akun yang sudah terkonfirmasi harus langsung masuk.
- Tidak mengubah migrasi atau database production. CI untuk commit sebelumnya #292 dikonfirmasi hijau semua; CI untuk perubahan ini menunggu workflow terbaru. Pengujian email nyata tetap diperlukan.


## 2026-11-25 — Perapian navigasi Portal Siswa dan formulir kirim ulang

- Memastikan Portal Siswa tampil sebagai item tersendiri di daftar menu publik desktop dan mobile dengan warna amber yang kontras.
- Menambahkan tautan Portal Siswa ke footer dan menghindari tombol duplikat pada header.
- Menambahkan UI permintaan ulang email konfirmasi pada halaman pendaftaran agar pengguna tidak mencoba signup berulang.
- Tidak ada perubahan database atau migrasi. CI terbaru perlu diverifikasi sebelum menyatakan pemeriksaan lulus.


### Koreksi markup formulir kirim ulang

- Mengganti pemisah baris literal yang sempat tersimpan pada JSX dengan newline sebenarnya agar file dapat diparse oleh ESLint/TypeScript.
- Menunggu hasil CI commit koreksi ini; CI sebelumnya mengidentifikasi parsing error pada file formulir, sementara database tests tetap sukses.


## 2026-11-25 — Pemulihan pengajuan setelah konfirmasi email

- Screenshot browser menunjukkan email sudah terkonfirmasi tetapi RPC penyimpanan pengajuan gagal; callback sebelumnya langsung sign-out sehingga metadata pendaftaran tidak bisa dipakai untuk retry dari halaman yang sama.
- Callback kini mempertahankan sesi dan metadata ketika penyimpanan gagal, serta mencatat kode/pesan/detail error database pada log server untuk diagnosis tanpa menampilkan detail sensitif ke publik.
- Menambahkan aksi Lanjutkan pengajuan yang mengulang RPC memakai metadata akun terkonfirmasi, tanpa membuat akun Auth baru. Duplikat hanya dianggap sukses jika antrean pengajuan milik akun benar-benar ditemukan.
- Memperbaiki JSX formulir yang masih menyimpan karakter literal \\n di antara wrapper dan form.
- Tidak mengubah migrasi atau database production. CI untuk commit ini perlu diverifikasi; pengujian browser perlu memastikan pengajuan masuk ke Verifikasi Portal Siswa.


### Koreksi akhir tampilan pemulihan

- Memastikan urutan kondisi pesan pemulihan memakai grouping boolean yang benar untuk kedua parameter error.
- Koreksi literal pemisah baris JSX divalidasi terhadap isi file pada branch sebelum commit.

- Pemeriksaan isi file memastikan karakter backslash-n literal di awal form diganti menjadi baris baru JSX yang sebenarnya.


## 2026-11-25 — Pemulihan pendaftaran tanpa metadata dan salin kode undangan

- Hasil uji pengguna: CI #299 hijau; callback konfirmasi sudah berhasil, tetapi aksi pemulihan menampilkan metadata pendaftaran tidak ditemukan. Ini menunjukkan data identitas pendaftaran tidak tersedia pada user metadata di sesi pemulihan. Penyebab historis persisnya belum dapat dipastikan dari bukti yang tersedia.
- Memperbaiki aksi pemulihan agar tetap dapat mengirim pengajuan ketika metadata tidak tersedia: pendaftar dapat mengisi ulang nama lengkap, NIS, dan tanggal lahir saat masih login dengan akun terkonfirmasi. Validasi dilakukan di server; RPC database tetap menjadi penjaga bahwa akun harus belum aktif dan belum terhubung.
- Jika metadata masih tersedia, data metadata diprioritaskan. Jika RPC mendeteksi duplikat, sistem hanya melanjutkan bila antrean untuk user yang sama benar-benar ditemukan.
- Menambahkan tombol **Salin kode undangan** pada detail siswa admin. Menggunakan Clipboard API pada HTTPS, menyediakan fallback instruksi salin manual, dan mempertahankan kode agar dapat dipilih/disalin dengan tekan lama.
- Pengiriman ulang email tidak mencoba melewati batas Supabase Auth. Rate limit provider tetap dihormati; pengguna diarahkan menunggu jika batas pengiriman tercapai. Pengujian email nyata diperlukan setelah deployment.
- Tidak mengubah migrasi atau database production. Menunggu CI commit ini.


## 2026-11-25 — Tombol pemulihan langsung terlihat setelah konfirmasi

- Temuan pengguna: pesan callback meminta menekan tombol di bawah, tetapi tombol pemulihan berada setelah formulir pendaftaran dan kirim ulang email yang panjang.
- Route `/portal/daftar?error=lanjutkan` kini mengaktifkan mode pemulihan khusus dan menampilkan formulir pemulihan tepat di bawah pesan konfirmasi, di bagian atas halaman.
- Dalam mode pemulihan, formulir signup baru dan resend email disembunyikan agar pengguna tidak membuat akun baru atau mengirim email lagi secara tidak perlu.
- Pesan `error=konfirmasi` diperjelas agar tidak mengklaim email berhasil dikonfirmasi jika pertukaran kode gagal.
- Tidak ada perubahan database/migrasi. CI dan uji browser setelah deployment masih diperlukan.


- CI #301 menemukan parsing error ESLint: cabang ternary mode pendaftaran menghasilkan dua elemen sibling tanpa fragment. Membungkus formulir signup dan bagian kirim ulang email dalam React Fragment; mode pemulihan tetap satu section. Database tests CI #301 lulus.


## 2026-11-25 — Countdown pengiriman ulang email konfirmasi

- CI #302 pada commit `d7515f94acfdffe5f5de495fb2eb60f0dc0fc189` dikonfirmasi hijau oleh pengguna.
- Menambahkan countdown 60 detik pada tombol kirim ulang email konfirmasi. Setelah signup berhasil mengirim email, timer langsung terlihat; setiap percobaan kirim ulang juga memulai jeda 60 detik berikutnya.
- Tombol dinonaktifkan selama countdown untuk mengurangi klik berulang. Batas ini hanya UX; Supabase tetap menjadi enforcement server-side.
- Menambahkan catatan bahwa layanan email bawaan Supabase memiliki batas 2 email per jam untuk seluruh project (bukan per pengguna). Karena itu countdown 60 detik adalah jeda minimum dan tidak menjamin kuota project sudah tersedia.
- Referensi resmi Supabase: Auth Rate Limits (cooldown signup 60 detik; built-in email provider 2 email/jam), Testing Auth Flows, dan Send Custom SMTP. Tidak ada perubahan SMTP, Auth config, database, atau migrasi.
- Menunggu CI untuk commit countdown ini dan uji browser setelah deployment.


## 2026-11-26 — Audit arsitektur dan pencatatan pekerjaan tertunda

- Audit ulang branch `main`, README, progress, tree repository, riwayat commit, dan workflow terbaru.
- Commit terbaru saat audit: `d5e8401541b2bafcc835e27b23ed06441fc3cbdd`.
- CI #303 sukses pada kedua job: `check` (lint, typecheck, unit test, build) dan `database-tests`.
- Menyelaraskan bagian Status saat ini dengan keadaan repository setelah pengembangan lifecycle siswa dan Portal Siswa.
- Menambahkan `docs/known-issues-and-deferred.md` sebagai daftar terpusat pengujian tertunda, batasan layanan email, verifikasi deployment, dan pekerjaan QA yang belum dikonfirmasi.
- Uji browser pendaftaran Portal Siswa sengaja ditunda oleh pengguna karena pembatasan pengiriman email bawaan Supabase. Countdown 60 detik hanya jeda UX; bukan penambahan kuota email.
- Tidak ada perubahan kode aplikasi, migrasi, konfigurasi runtime, atau database production.
- Rekomendasi fase berikutnya: rancang Modul Absensi Siswa, dimulai dengan aturan pencatatan per hari/rombel, status kehadiran, pencegahan duplikasi, koreksi dengan audit trail, matriks permission, dan kebutuhan rekap. Jangan membuat migrasi sebelum aturan domain disepakati.


## 2026-11-26 — Fondasi undangan akun guru (branch kerja)
- Menambahkan migrasi baru `20261124360000_teacher_account_invitations.sql`: pemetaan privat satu-ke-satu `teacher_user_links`, undangan guru dengan hash token, masa berlaku 24 jam, pencabutan, validasi email terverifikasi dan pencocokan email profil, serta klaim atomik yang mengaktifkan akun dan memberi role `guru`.
- Menambahkan form undangan pada halaman edit profil guru. Admin membuat tautan undangan untuk email yang sudah tercatat pada profil; tautan disalin dan dikirim melalui kanal resmi sekolah (belum mengirim email otomatis).
- Menambahkan halaman aktivasi `/guru/aktivasi`; guru menetapkan password sendiri. Callback Auth mengklaim undangan setelah verifikasi email.
- Login role guru diarahkan ke `/ruang-guru`; guard area admin menolak akun guru murni. Akun dengan role admin yang sah tetap menggunakan area admin.
- `/ruang-guru` saat ini merupakan landing awal, belum memuat roster atau absensi.
- **Belum diuji dan belum diterapkan:** migrasi, flow signup/email/callback, role redirect, dan browser QA. Jangan menjalankan `db push` tanpa persetujuan eksplisit dan pemeriksaan migration list remote.
- Commit dasar branch: `a1043ab4c355e29415c937c8156e5f4bc9f01d76`. Semua file perubahan harus diperiksa CI sebelum merge.


### Catatan perbaikan CI undangan guru
- CI #305: lint lolos; typecheck gagal karena action log memakai nilai `revoke` yang tidak tersedia pada tipe activity action. Database test juga menemukan fixture belum memiliki role `guru`.
- Perbaikan: gunakan action log `update` untuk pencabutan undangan dan pastikan role sistem `guru` tersedia secara idempotent pada migrasi fitur.
- CI #306: lint, typecheck, dan unit test lolos; database test menemukan fixture permission belum mengikuti permission khusus `teacher_accounts:manage`. Perbaikan fixture dan pemberian permission kepada role `admin_sekolah` sudah disiapkan pada commit berikutnya.
- Menambahkan validasi pasangan token/email sebelum signup Auth agar alamat email yang salah tidak membuat akun Auth yatim yang tidak dapat diklaim.
- Status akhir tetap menunggu CI pada commit terbaru; jangan menandai fitur lulus sebelum job database dan build selesai.
- CI #307: typecheck dan unit test lolos; database test menemukan delimiter fungsi validasi token/email terpotong pada migrasi. Fungsi diperbaiki dengan dollar-quote bernama, validasi token heksadesimal tanpa pola ambigu, serta grant execute eksplisit untuk anon/authenticated. Menunggu CI ulang pada commit sesudah perbaikan ini.
- Audit lanjutan menemukan trigger `users_guard` dari onboarding siswa hanya mengizinkan aktivasi mandiri jika ada `student_portal_accounts`. Migrasi guru kini memperluas guard agar akun baru dapat aktif mandiri hanya setelah `teacher_user_links` dibuat melalui klaim undangan terverifikasi. Fixture database kini memasang trigger yang sama dan menguji aktivasi sebelum/sesudah link.
- CI #309: database job berhenti pada bootstrap karena delimiter fungsi trigger fixture memakai `$` tunggal. Fixture diperbaiki memakai delimiter bernama `$stub$`; menunggu CI ulang.
- Penguatan fixture: berikan grant UPDATE pada `public.users` agar skenario pra-klaim benar-benar melewati trigger status (bukan berhenti di privilege tabel), lalu assertion memastikan akun tetap nonaktif saat link belum ada.
- CI #311: guard trigger sudah berjalan, tetapi assertion pasca-penolakan mencoba membaca `public.users` saat masih ber-role authenticated tanpa grant SELECT fixture. Assertion dipindahkan setelah `RESET ROLE`; pengujian tetap menjalankan UPDATE di bawah role authenticated agar trigger yang diuji.
- **CI #312 sukses** pada commit `0da2e49b687fe89a0091a01cad3bb2e2ccc1ffae`: job `check` (lint, typecheck, unit test, build) dan `database-tests` seluruhnya sukses. Cakupan database termasuk penolakan aktivasi sebelum link guru tersedia dan aktivasi setelah klaim undangan.


## 2026-11-26 — Undangan akun guru digabung ke main
- PR #1 `feat(teachers): secure teacher account invitations` berhasil digabung ke `main` melalui squash merge.
- Commit merge: `7ec5cf7589c351f49e4fedddc106c074faf66a02`.
- CI #312 pada commit kode `0da2e49b687fe89a0091a01cad3bb2e2ccc1ffae` sukses; CI #313 pada head PR terakhir `e32d35b858c4a7a6cc37543ba9262fabbc7b3930` juga sukses. Lint, typecheck, unit test, build, database assertions, dan concurrency tests lulus.
- Migrasi `20261124360000_teacher_account_invitations.sql` **belum diterapkan ke Supabase production**. Tidak ada perubahan remote database pada sesi ini.
- Undangan admin saat ini menghasilkan tautan 24 jam untuk disalin dan dikirim manual melalui kanal resmi; belum ada email undangan otomatis.
- Halaman `/ruang-guru` masih landing awal. Belum ada roster kelas atau fitur absensi.
- Tindak lanjut: verifikasi migration list pada project Website Sekolah, pastikan backup, minta persetujuan sebelum deployment, lalu uji signup/verifikasi email pada domain production. Setelah fondasi guru terverifikasi, lanjutkan Modul Absensi Siswa sesuai aturan domain yang telah disepakati.


## 2026-11-26 — Peralihan verifikasi email ke OTP (branch kerja)
- Branch `feat/email-otp-verification` dibuat dari `main`.
- Kode mengalihkan pendaftaran Portal Siswa (undangan dan mandiri) serta aktivasi undangan Guru ke OTP 6 digit melalui Supabase Auth `verifyOtp({ type: "signup" })`.
- Pengiriman ulang kode OTP tersedia pada alur Portal Siswa dan Guru. Callback lama dipertahankan untuk kompatibilitas tautan yang sudah terkirim sebelum perubahan.
- **Konfigurasi eksternal wajib:** template email Signup/Confirmation di Supabase harus menampilkan `{{ .Token }}`; template yang hanya menggunakan `{{ .ConfirmationURL }}` tidak mengirim kode yang dapat dimasukkan di form.
- Konfigurasi dashboard Supabase belum diubah. Belum ada pengujian email nyata/browser production atau verifikasi kuota email provider.
- Tidak ada migrasi, perubahan database, perubahan project Supabase, atau deployment pada sesi ini.

- Pemeriksaan lanjutan setelah commit awal: memperbaiki pembungkusan JSX pada form aktivasi Guru dan mempertahankan tampilan langkah OTP saat validasi server menolak format kode.


- CI run `45833840670` pada commit `62c78826c4c36507490798f20bc9d4e8331b6d3e` sukses penuh: lint, typecheck, unit test, build, database assertions, dan concurrency tests. Ini belum mencakup pengiriman email nyata, browser QA, perubahan template Supabase, atau deployment.


## 2026-11-27 — Perbaikan tahap OTP setelah permintaan kirim ulang
- Audit kode setelah PR #3 digabung menemukan bahwa aksi kirim ulang OTP Portal Siswa hanya mengembalikan pesan/email, tanpa `awaitingOtp`; akibatnya kolom input OTP hanya tampil setelah signup awal berhasil, bukan setelah resend berhasil.
- Perbaikan pada branch `fix/student-otp-resend-flow`: respons resend sukses kini mengaktifkan tahap OTP dan membawa email yang diminta; UI memakai email dari respons resend untuk form verifikasi. Jika resend gagal/rate-limit, tahap OTP tidak diaktifkan oleh aksi resend.
- Terapkan pola state yang sama pada aktivasi Guru agar state verifikasi dan email tetap konsisten.
- Belum ada perubahan database, migrasi, konfigurasi Supabase, atau deployment. Perlu CI dan browser QA setelah PR ditinjau/digabung.


## 2026-11-27 — Diagnosis kegagalan signup setelah peralihan OTP

- Audit kode pada `main` menemukan pesan generik pendaftaran berasal dari fallback `getSignupErrorMessage()` saat Supabase Auth mengembalikan error yang belum dipetakan.
- Peralihan ke OTP membuat keberhasilan signup bergantung pada pengiriman email konfirmasi. Pengguna mengonfirmasi konfigurasi SMTP kustom Supabase telah diselesaikan pada 2026-11-26; pastikan template Confirm signup menggunakan `{{ .Token }}` dan lakukan uji pengiriman terkontrol.
- Memetakan kode Auth `email_address_not_authorized`, `smtp_error`, dan `unexpected_failure` ke pesan yang lebih spesifik agar kendala provider tidak lagi tampil sebagai error duplikasi email yang ambigu.
- **Batas perbaikan:** perubahan kode ini hanya memperjelas pesan error; tidak mengubah konfigurasi SMTP/Supabase. Status keberhasilan signup end-to-end tetap perlu divalidasi melalui uji email nyata.
- Tidak mengubah database, migrasi, konfigurasi Supabase, atau project lain.


## 2026-11-27 — Diagnostik lanjutan signup OTP
- Pengguna melaporkan pesan generik signup tetap muncul setelah pemetaan error pada PR #5.
- Audit menunjukkan fallback masih menyamarkan seluruh kode Auth yang belum dikenal; log signup juga hanya mencatat kode/status tanpa pesan provider.
- Branch `fix/auth-signup-diagnostic-errors` mengubah fallback agar menampilkan kode Auth dan status HTTP (tanpa menampilkan pesan provider mentah kepada pengguna), serta mencatat `error.message` di log server untuk diagnosis.
- Perubahan ini belum membuktikan atau memperbaiki akar kegagalan provider. Setelah deployment, satu percobaan terkontrol diperlukan untuk memperoleh kode diagnostik; jika pesan generik lama tetap tampil persis, periksa deployment Worker atau jalur form/action yang sedang dipakai.
- Tidak ada perubahan database, migrasi, konfigurasi Supabase, atau project lain. CI dan deployment belum diverifikasi.

## 2026-11-27 — Akar kegagalan OTP terkonfirmasi: kredensial SMTP Gmail
- Auth Logs production menunjukkan request `POST /signup` gagal dengan `error_code=unexpected_failure`, HTTP 500, dan respons SMTP Gmail `535 5.7.8 Username and Password not accepted (BadCredentials)`.
- Akar masalah terkonfirmasi berada pada autentikasi SMTP Gmail yang dikonfigurasi di Supabase, bukan pada validasi kode OTP atau komponen input. Supabase tidak dapat mengirim email konfirmasi sehingga signup gagal sebelum aplikasi mengaktifkan state input OTP.
- PR #7 pada branch `fix/gmail-smtp-auth-error-guidance` memetakan pesan Gmail 535 BadCredentials pada signup dan resend menjadi instruksi spesifik untuk admin memperbarui SMTP password menggunakan Google App Password. Pesan mentah provider tetap hanya dicatat di log server.
- Tindakan eksternal wajib: admin membuat Google App Password untuk akun Gmail pengirim (dengan 2-Step Verification aktif), lalu memperbarui password SMTP pada project Supabase Website Sekolah di Authentication → SMTP Settings. Jangan memakai password login Gmail biasa. Pastikan username dan sender email sesuai akun Gmail tersebut.
- Setelah SMTP diperbaiki, lakukan satu uji signup dan satu uji resend terkontrol; pastikan email OTP diterima dan template Confirm signup memakai `{{ .Token }}`. Jangan mengulang percobaan berkali-kali karena batas pengiriman provider.
- Perubahan PR #7 hanya menyentuh pesan diagnostik aplikasi dan dokumentasi. Tidak ada perubahan database, migrasi, secret, konfigurasi Supabase, project lain, atau deployment. CI dan browser QA masih menunggu.


## 2026-11-27 — Penyesuaian panjang OTP Supabase menjadi 8 digit
- Pengguna berhasil menerima email OTP setelah perbaikan SMTP, tetapi menemukan kode yang dikirim Supabase terdiri dari 8 digit sedangkan formulir dan validasi server hanya menerima 6 digit.
- Menyesuaikan input Portal Siswa: petunjuk, label, HTML pattern, dan maxLength menjadi 8 digit; validasi server `verifyStudentPortalOtp` kini menerima tepat 8 angka.
- Menyamakan alur aktivasi akun Guru dengan panjang 8 digit, termasuk input UI, pola HTML, pesan, dan validasi server, agar kedua alur email OTP konsisten dengan konfigurasi Supabase saat ini.
- Perubahan dilakukan pada branch `fix/gmail-smtp-auth-error-guidance` yang menjadi head PR #7. Tidak mengubah konfigurasi Supabase, template email, database, migrasi, atau deployment.
- CI dan pengujian browser/email nyata untuk panjang kode 8 digit masih perlu dijalankan setelah commit ini.
\n\n## 2026-11-27 — Pengikatan undangan Portal Siswa ke email\n- Temuan audit: form data induk siswa tidak memiliki kolom email, sedangkan RPC undangan hanya mengikat token ke `student_id`; klaim undangan sebelumnya tidak membandingkan email Auth dengan email yang dituju. Token dapat diklaim akun dengan email berbeda.\n- Menambahkan field email opsional pada form tambah/edit siswa, validasi server, penyimpanan, dan tampilan detail. Email harus diisi sebelum admin dapat membuat undangan.\n- Menambahkan migrasi `20261127300000_student_portal_invitation_email_binding.sql`: menyimpan `target_email` pada undangan, membuat undangan dari email siswa, dan memvalidasi kecocokan email Auth saat klaim. Undangan lama tanpa `target_email` tidak dapat diklaim; buat ulang setelah email siswa diisi.\n- Form detail siswa menampilkan alamat email target dan instruksi agar pendaftar memakai alamat yang sama.\n- Perubahan berada di branch `fix/student-portal-invitation-email`. Migrasi belum diterapkan ke Supabase; belum ada CI/browser/OTP end-to-end verification. Jangan menyatakan siap produksi sampai CI dan migration tests lulus.\n

## 2026-11-27 — Perbaikan penyimpanan data siswa dan verifikasi pendaftaran mandiri
- Audit PR #8 setelah merge menemukan kode aplikasi menulis `students.email`, tetapi migrasi `20261127300000_student_portal_invitation_email_binding.sql` harus diterapkan secara terpisah ke Supabase production. Jika belum diterapkan, insert/update data siswa gagal karena kolom email belum ada.
- Aksi simpan siswa kini mencatat kode, pesan, detail, dan hint error database pada log server; kode error kolom email yang belum tersedia dipetakan ke pesan yang menyebut nama migrasi yang perlu diterapkan. Email dinormalisasi dengan trim dan lowercase.
- Fungsi persetujuan pendaftaran mandiri diperbarui melalui migrasi `20261127310000_student_portal_registration_identity_normalization.sql`: NIS dibandingkan tanpa whitespace, nama dibandingkan tanpa membedakan kapitalisasi dan dengan spasi berulang dinormalisasi, sedangkan tanggal lahir tetap harus sama persis.
- Database test runner kini menerapkan kedua migrasi terbaru dan menambahkan skenario yang menguji kecocokan NIS/nama walau terdapat spasi dan perbedaan kapitalisasi pada data induk.
- Perubahan berada di branch `fix/student-save-and-registration-approval`; CI, pengujian migrasi, dan verifikasi production belum dilakukan. Migrasi harus diterapkan ke Supabase setelah memeriksa migration list remote dan memastikan urutan migrasi.

- Temuan tambahan dari CI database: migrasi students foundation memakai grant per kolom untuk melindungi status/audit. Karena itu menambahkan `students.email` tanpa grant eksplisit membuat insert/update oleh role `authenticated` ditolak walaupun kolom sudah ada. Migrasi perbaikan kini memberikan `INSERT(email)` dan `UPDATE(email)`; database test menegaskan kedua privilege tersebut tersedia.

- Audit migrasi lanjutan juga menemukan migrasi email PR #8 mengganti RPC klaim undangan dan tanpa sengaja menghilangkan guard akun Auth harus nonaktif/belum dihapus. Migrasi perbaikan terbaru memulihkan guard tersebut sambil mempertahankan pencocokan email undangan; guard yang sama dipertahankan pada RPC persetujuan mandiri.
- Fixture database dirapikan agar perubahan data uji dilakukan sebagai admin dan alamat email undangan sesuai dengan alamat Auth.


## 2026-11-27 — Arsip data siswa dari dashboard admin

- Menambahkan aksi **Arsipkan siswa** pada halaman detail siswa. Aksi memerlukan permission `students:delete` dan konfirmasi teks `HAPUS`; data aktif disembunyikan dari daftar utama.
- Penghapusan dibuat sebagai soft-delete melalui kolom `students.archived_at`, bukan hard-delete, agar riwayat status, penempatan kelas, dan audit akademik tidak rusak atau hilang.
- Dashboard memiliki tampilan **Lihat arsip** dan halaman detail arsip menyediakan aksi pemulihan dengan permission `students:update`.
- RPC database memeriksa permission dan menolak pengarsipan jika siswa masih terhubung ke akun Portal Siswa, memiliki undangan yang belum kedaluwarsa, atau masih mempunyai penempatan kelas aktif. Undangan baru juga ditolak untuk siswa yang sudah diarsipkan.
- Menambahkan database assertions untuk pengarsipan dan pemulihan serta memastikan riwayat status tetap tersimpan.
- Migrasi baru: `20261127320000_student_archive.sql`. Migrasi belum diterapkan ke Supabase production; perlu diperiksa dan diterapkan setelah PR lulus CI.
- Menunggu CI dan uji browser setelah merge/deploy. Tidak ada perubahan pada database production.


## 2026-11-27 — Portal Siswa selesai diuji dan Modul Absensi tahap pertama

- Pengguna mengonfirmasi simulasi pendaftaran Portal Siswa berhasil dan akun dapat login ke portal. Daftar deferred tidak lagi memuat item uji pendaftaran Portal Siswa.
- Keputusan domain absensi disetujui: satu sesi harian per rombel; guru wali kelas pencatat; status hadir/terlambat/sakit/izin/alpa; batas input hari ini hingga 7 hari ke belakang; submit memerlukan seluruh status; koreksi admin wajib alasan; lock/unlock oleh admin; siswa hanya melihat absensi sendiri setelah submit.
- PR #12 dibuat pada branch feat/student-attendance-daily.
- Migrasi 20261127330000_student_daily_attendance.sql menambah sesi, entri, histori koreksi, permission, dan RPC untuk roster, simpan draft, submit, koreksi, lock/unlock, serta pembacaan pribadi siswa.
- Route /ruang-guru menampilkan roster wali kelas dan form draft/submit. Route /admin/absensi menyediakan rekap harian, koreksi, dan lock/unlock. Portal Siswa menampilkan riwayat kehadiran pribadi.
- Database test runner diperbarui untuk menerapkan migrasi dan memeriksa akses tabel serta keberadaan RPC/permission.
- Tidak ada migrasi production yang dijalankan. Browser QA belum dilakukan. Rekap bulanan/persentase dan ekspor masih tahap berikutnya.


## 2026-11-27 — Modul Absensi masuk main dan audit lanjutan

- PR #12 `feat(attendance): implement daily student attendance` merged ke `main` pada merge commit `c7c15aa0bd2aee942a7e30563f10fa53fe27d03b`.
- CI #367 pada commit head PR `0a56f8933d6315d6ddc9bbbe428f49921cbb9fa8` sukses: lint, typecheck, unit test, build, database assertions, serta concurrency tests.
- Audit pasca-merge menemukan ketidaksesuaian UI: RPC membatasi input guru dari hari ini sampai 7 hari sebelumnya, tetapi halaman `/ruang-guru` selalu mengirim tanggal hari ini dan tidak menyediakan date picker.
- Perbaikan pemilihan tanggal sedang dikerjakan pada branch `fix/teacher-attendance-date-range`. Pilihan tanggal divalidasi di server dan batas database tetap menjadi enforcement utama.
- Browser QA absensi dengan akun guru wali kelas, admin, dan siswa masih belum dilakukan. Migrasi absensi belum diterapkan ke Supabase production; tidak ada perubahan production database pada pekerjaan ini.


## 2026-11-28 — PR absensi/arsip merged dan QA admin awal
- PR #13 `fix(attendance): allow teachers to select attendance dates` merged ke `main` melalui `db742ce0f6ba4b3ab546435f0826dfa40cd6c7b3`. Pemilih tanggal guru dan validasi server kini tersedia di main.
- PR #14 `fix(database): make student archive migration safe to resume` merged ke `main` melalui `01d3b0a3171c333a5c97b88cc222c6f9c511a3e5`. Penambahan `students.archived_at` memakai `ADD COLUMN IF NOT EXISTS`, dan database test menguji rerun migrasi.
- Pengguna mengonfirmasi CI seluruhnya hijau sebelum merge.
- Browser QA admin: pengguna mengonfirmasi tab Absensi tampil di dashboard admin dan rekap absensi termuat. Cakupan ini hanya memverifikasi tampilan/rekap harian; koreksi, lock/unlock, input guru, dan riwayat Portal Siswa belum terkonfirmasi.
- Tidak ada migrasi yang diterapkan ke Supabase production. Status migration history dan backup tetap perlu diverifikasi sebelum deployment.


## 2026-11-28 — Rekap bulanan absensi merged dan deployed
- PR #15 dokumentasi QA merged (`f283b144781c777f10a7f98d7da463b3ebe6b7ea`).
- PR #16 rekap bulanan absensi per rombel merged (`fef07c7122728456327fcebe08e76e42c373c26c`). Pengguna mengonfirmasi CI #375 hijau, PR merged, dan migrasi `20261128090000_student_attendance_monthly_summary.sql` sudah diterapkan ke Supabase.
- Rekap bulanan menghitung sesi `submitted`/`locked`, distribusi status, dan persentase `(present + late) / seluruh entri × 100`; draft dikecualikan.
- Pekerjaan berikutnya: ekspor CSV rekap bulanan. Branch `feat/attendance-monthly-csv-export` menambahkan endpoint terproteksi permission `attendance:view_all`, serializer CSV dengan BOM/escaping dan mitigasi formula injection, link unduh pada dashboard, serta unit tests. Menunggu CI dan review.
- Browser QA rekap bulanan/unduh CSV belum dikonfirmasi. Tidak ada perubahan database production untuk ekspor.


## 2026-11-28 — Ekspor CSV absensi bulanan
- PR #17 sudah merged dengan merge commit `081527840df3ac1229af7fdffe1b7d42e031ea5d`; pengguna mengonfirmasi CI hijau.
- Endpoint ekspor mengambil data dari RPC rekap bulanan, menjaga konsistensi dengan dashboard, dan memerlukan `attendance:view_all`.
- Belum ada migrasi database baru. Browser QA unduh dan validasi isi CSV masih tertunda.

## 2026-11-28 — Penguatan permission penempatan siswa individual
- Audit menemukan policy RLS INSERT/UPDATE `student_class_enrollments` hanya mewajibkan permission update, sedangkan server action penempatan individual juga mensyaratkan `classes:view` dan `students:view`. Klien PostgREST berpotensi melewati pemeriksaan view pada server action.
- Branch `fix/student-enrollment-rbac-guards-main` menambahkan migrasi `20261128100000_student_enrollment_permission_guards.sql`: INSERT/UPDATE kini mensyaratkan `classes:view`, `students:view`, `classes:update`, dan `students:update`.
 pada blok test hasil integrasi; diperbaiki pada commit lanjutan dan menunggu CI ulang.
- Tidak ada migrasi production yang dijalankan.

## 2026-11-28 — Penguatan regression test arsip siswa
- Menambahkan skenario database untuk memastikan arsip ditolak jika siswa masih memiliki penempatan kelas aktif, akun Portal Siswa tertaut, atau undangan Portal Siswa yang belum kedaluwarsa.
- Menambahkan skenario lifecycle: tutup penempatan melalui RPC withdrawn, arsipkan siswa, lalu pastikan enrollment, histori kelas, dan pelepasan kapasitas tetap terjaga.
- Pengujian production/browser belum dilakukan. Migrasi 20261127320000_student_archive.sql tidak dijalankan pada Supabase production.

## 2026-11-28 — Regression test kenaikan kelas massal
- Memperluas database assertions untuk menolak kenaikan tanpa `students:update`, target dengan tingkat yang tidak satu tingkat di atas, target pada tahun ajaran yang sama, dan sumber dari tahun ajaran tidak aktif.
- Memastikan percobaan yang ditolak tidak menambah atau mengubah penempatan siswa pada kelas tujuan yang valid maupun target tidak valid.
- Skenario rollback kapasitas tidak cukup dan duplikasi penempatan sudah tercakup pada test sebelumnya. Browser QA dashboard tetap menunggu.
- Tidak ada migrasi baru atau perubahan Supabase production.


## 2026-11-28 — Regression test kelulusan massal kelas XII
- Memperkuat skenario kelulusan massal untuk menolak permission yang tidak lengkap, kelas non-XII, sumber dari tahun ajaran tidak aktif, dan tanggal kelulusan null.
- Memastikan tanggal kelulusan yang melanggar constraint membatalkan seluruh perubahan, termasuk tidak membuat histori status parsial.
- Memastikan kelulusan sukses menyimpan tanggal dan histori untuk seluruh siswa, sedangkan pemanggilan ulang tanpa siswa aktif ditolak tanpa menggandakan histori.
- Browser QA dashboard kelulusan tetap menunggu. Tidak ada migrasi baru atau perubahan Supabase production.


## 2026-11-28 — Regression test guard undangan akun guru
- Menambah uji database untuk undangan yang dicabut, kedaluwarsa, dan telah diklaim agar tidak dapat digunakan ulang.
- Menambah uji bahwa email Auth yang belum diverifikasi dan akun yang sudah memiliki role tidak dapat mengklaim undangan; undangan tetap belum terpakai dan tidak membuat link guru.
- Memastikan profil guru yang sudah tertaut tidak dapat menerima undangan baru.
- Browser QA alur undangan, termasuk token salah dan redirect role, tetap menunggu. Tidak ada migrasi baru atau perubahan Supabase production.

## 2026-11-28 — Regression test guard undangan akun guru merged
- PR #23 `test(auth): cover teacher invitation rejection guards` sudah merged ke `main`; pengguna mengonfirmasi CI hijau.
- Commit head PR: `a65e7107cd73775bdd2267ec3828be29ede67038`.
- Database regression tests mencakup undangan dicabut/kedaluwarsa/sudah diklaim, email Auth belum diverifikasi, akun yang sudah memiliki role, dan profil guru yang sudah tertaut.
- Perbaikan fixture memastikan role uji benar-benar tersimpan sebelum skenario authenticated dijalankan. Tidak ada migrasi baru, perubahan database production, atau deployment.
- Tindak lanjut tersisa: browser QA alur undangan guru (token salah/kedaluwarsa/dicabut/dipakai ulang, email berbeda/belum terverifikasi, akun existing-role, duplikasi link, dan redirect role), serta verifikasi migration `20261124360000_teacher_account_invitations.sql` pada project Supabase Website Sekolah setelah pemeriksaan migration history dan backup.

## 2026-11-28 — Dokumentasi QA lanjutan setelah PR #24
- PR #24 dokumentasi regression test undangan guru sudah merged ke `main`; pengguna mengonfirmasi sukses.
- Merge commit PR #24: `9b880232c038fe96f4141cb5fdcbce9ba6f9e914`.
- Audit ulang migrasi `20261124360000_teacher_account_invitations.sql`: token disimpan sebagai SHA-256, masa berlaku 24 jam, email diverifikasi dan dicocokkan, klaim mengunci baris undangan, dan pemeriksaan akun/role/link dilakukan di database.
- Tidak dilakukan koneksi atau perubahan pada Supabase production. Status penerapan migrasi masih harus diverifikasi setelah persetujuan eksplisit dan pemeriksaan project/migration history.
- Langkah paling dekat: browser QA manual alur undangan guru; setelah itu browser QA absensi yang masih tertunda. Kalender pendidikan pada PR #2 adalah implementasi lama yang tidak boleh digabung tanpa audit kompatibilitas terhadap modul absensi harian yang kini ada di main.


## 2026-11-28 — Browser QA happy-path undangan akun guru
- Pengguna mengonfirmasi simulasi undangan guru berjalan mulus: proses aktivasi/OTP berhasil dan akun dapat masuk ke `/ruang-guru`.
- Ini menutup verifikasi browser untuk alur normal saja. Token salah/kedaluwarsa/dicabut/dipakai ulang, email tidak cocok/belum terverifikasi, akun existing-role, penggunaan tautan duplikat, dan login ulang setelah logout belum dikonfirmasi.
- Migrasi `20261124360000_teacher_account_invitations.sql` pada Supabase production masih belum diverifikasi; tidak ada akses atau perubahan database production pada QA ini.
- Fokus QA berikutnya: modul Absensi (pencatatan guru, koreksi dan lock/unlock admin, riwayat Portal Siswa, rekap bulanan, serta ekspor CSV).