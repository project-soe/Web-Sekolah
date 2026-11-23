# Website Sekolah

Website resmi sekolah dan sistem informasi manajemen sekolah (SIMS), dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, dan Supabase.

## Teknologi

- **Framework:** Next.js 16.4.6 (App Router)
- **UI:** React 19, Tailwind CSS 4, komponen UI proyek, Lucide
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security, Storage)
- **Deployment:** Cloudflare Workers melalui OpenNext
- **Package manager:** pnpm 12

## Menjalankan proyek

Persyaratan: Node.js >= 20.9 dan pnpm sesuai versi pada `package.json`.

```bash
pnpm install
pnpm dev
```

Buka http://localhost:3000.

## Perintah pemeriksaan

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Jalankan pemeriksaan yang relevan setelah perubahan. Jangan menganggap pemeriksaan berhasil sebelum benar-benar dijalankan.

## Konfigurasi lingkungan

Salin variabel yang dibutuhkan ke file lingkungan lokal (jangan commit secret):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Kredensial service role tidak boleh diekspos ke browser atau dimasukkan ke variabel `NEXT_PUBLIC_*`.

## Arsitektur ringkas

- `src/app/(public)/`: halaman website publik.
- `src/app/admin/`: area administrasi.
- `src/features/`: fitur berdasarkan domain, termasuk query, action, schema, dan komponen.
- `src/lib/supabase/`: klien Supabase server/public.
- `src/lib/storage/`: validasi dan URL media.
- `supabase/migrations/`: perubahan skema database yang berurutan.
- `docs/`: dokumentasi teknis tambahan.
- `progress.md`: status pekerjaan, keputusan penting, pemeriksaan, dan langkah lanjutan.

### Prinsip keamanan data

1. Akses database dibatasi dengan PostgreSQL RLS; menyembunyikan elemen UI bukan kontrol keamanan.
2. Klien publik memakai anon key dan hanya membaca data yang diizinkan policy.
3. Data konten baru tidak boleh otomatis tampil ke publik; publikasi harus eksplisit.
4. Perubahan skema dibuat sebagai migrasi baru. Hindari mengedit migrasi yang mungkin sudah diterapkan.
5. Jangan pernah menyimpan secret, password, token, atau data pribadi sensitif dalam dokumentasi.

## Database

Migrasi berada di `supabase/migrations/` dan harus diterapkan berurutan ke proyek Supabase yang benar sebelum fitur yang bergantung padanya diuji secara integrasi.

Fondasi konten publik terbaru menambahkan tabel `departments`, `teachers`, `news_categories`, `news`, dan `announcements`. Lihat `progress.md` untuk status penerapan dan tindak lanjutnya.

## Dokumentasi dan serah terima

**Mulai dari `progress.md` sebelum mengerjakan tugas baru.** Dokumen itu mencatat commit terakhir, fitur yang selesai, status migrasi, hal yang belum diverifikasi, dan urutan pekerjaan berikutnya.

Setiap perubahan kode, database, konfigurasi, atau keputusan arsitektur wajib memperbarui README dan/atau progress sesuai dampaknya. Untuk setiap sesi kerja, tambahkan catatan progress agar pengembang berikutnya tidak perlu menelusuri seluruh riwayat commit.
