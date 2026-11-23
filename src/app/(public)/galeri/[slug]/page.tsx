import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { getPublicGalleries, getPublicGalleryBySlug } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const galleries = await getPublicGalleries();
  return galleries.map((gallery) => ({ slug: gallery.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getPublicGalleryBySlug(slug);
  if (!gallery) return { title: "Galeri tidak ditemukan" };
  return {
    title: gallery.title,
    description: gallery.description || `Dokumentasi foto: ${gallery.title}`,
    openGraph: {
      title: gallery.title,
      description: gallery.description || undefined,
      images: gallery.cover_path ? [publicMediaUrl(gallery.cover_path)!] : undefined,
    },
  };
}

export default async function GalleryDetailPage({ params }: Props) {
  const { slug } = await params;
  const gallery = await getPublicGalleryBySlug(slug);
  if (!gallery) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <Link href="/galeri" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Semua galeri
      </Link>
      <header className="mt-8 max-w-3xl">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">Album Foto</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{gallery.title}</h1>
        {gallery.description && (
          <p className="mt-4 leading-relaxed text-muted-foreground">{gallery.description}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">{gallery.gallery_images.length} foto dalam album ini</p>
      </header>

      {gallery.gallery_images.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <ImageIcon className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Foto belum tersedia</h2>
          <p className="mt-2 text-sm text-muted-foreground">Foto untuk album ini akan segera ditambahkan.</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.gallery_images.map((photo) => {
            const src = publicMediaUrl(photo.image_path);
            if (!src) return null;
            return (
              <figure key={photo.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image src={src} alt={photo.alt_text || photo.caption || gallery.title} fill unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover" />
                </div>
                {photo.caption && <figcaption className="px-4 py-3 text-sm text-muted-foreground">{photo.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
