import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Images, ImageIcon, ArrowRight } from "lucide-react";
import { getPublicGalleries } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Galeri Sekolah",
  description: "Dokumentasi foto kegiatan dan lingkungan sekolah.",
};
export const revalidate = 300;

export default async function GalleryPage() {
  const galleries = await getPublicGalleries();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">Dokumentasi Sekolah</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Galeri Sekolah</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Kumpulan dokumentasi kegiatan, prestasi, dan keseharian di lingkungan sekolah.
        </p>
      </header>

      {galleries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Images className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Belum ada galeri</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dokumentasi sekolah akan ditampilkan setelah album diterbitkan oleh pengelola.
          </p>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => {
            const coverPath = gallery.cover_path ?? gallery.gallery_images[0]?.image_path;
            const cover = publicMediaUrl(coverPath);
            return (
              <article key={gallery.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Link href={`/galeri/${gallery.slug}`} className="group block">
                  <div className="relative aspect-[16/9] bg-muted">
                    {cover ? (
                      <Image src={cover} alt={gallery.title} fill unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <ImageIcon className="size-12" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Images className="size-4" aria-hidden />
                      {gallery.gallery_images.length} foto
                    </div>
                    <h2 className="mt-3 text-xl font-bold leading-snug group-hover:text-primary">{gallery.title}</h2>
                    {gallery.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{gallery.description}</p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Lihat album <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
