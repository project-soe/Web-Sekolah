import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Newspaper } from "lucide-react";
import { getPublicNews, getPublicNewsBySlug } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export async function generateStaticParams() {
  const items = await getPublicNews();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicNewsBySlug(slug);
  if (!item) return { title: "Berita tidak ditemukan" };
  const description = item.excerpt || item.content.slice(0, 160);
  return {
    title: item.title,
    description,
    openGraph: { title: item.title, description, images: item.cover_path ? [publicMediaUrl(item.cover_path)!] : undefined },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicNewsBySlug(slug);
  if (!item) notFound();
  const cover = publicMediaUrl(item.cover_path);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link href="/berita" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" aria-hidden /> Semua berita</Link>
      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <time dateTime={item.published_at}>{dateFormat.format(new Date(item.published_at))}</time>
          {item.category?.name && <span>• {item.category.name}</span>}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
        {item.excerpt && <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{item.excerpt}</p>}
      </header>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        {cover ? <Image src={cover} alt={item.title} fill priority unoptimized sizes="(max-width: 896px) 100vw, 896px" className="object-cover" /> : <div className="grid size-full place-items-center text-muted-foreground"><Newspaper className="size-14" aria-hidden /></div>}
      </div>
      <div className="mt-10 text-base leading-8 whitespace-pre-line text-foreground">{item.content}</div>
    </article>
  );
}
