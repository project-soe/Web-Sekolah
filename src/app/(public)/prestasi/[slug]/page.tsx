import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { getPublicAchievementBySlug, getPublicAchievements } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export async function generateStaticParams() {
  const items = await getPublicAchievements();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicAchievementBySlug(slug);
  if (!item) return { title: "Prestasi tidak ditemukan" };
  const description = item.description.slice(0, 160);
  return {
    title: item.title,
    description,
    openGraph: { title: item.title, description, images: item.image_path ? [publicMediaUrl(item.image_path)!] : undefined },
  };
}

export default async function AchievementDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicAchievementBySlug(slug);
  if (!item) notFound();
  const image = publicMediaUrl(item.image_path);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link href="/prestasi" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Semua prestasi
      </Link>
      <header className="mt-8">
        <p className="text-sm font-semibold text-primary">{item.achievement_level}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
        {item.recipient && <p className="mt-4 text-lg font-medium text-muted-foreground">{item.recipient}</p>}
        {item.achievement_date && (
          <time className="mt-3 block text-sm text-muted-foreground" dateTime={item.achievement_date}>
            {dateFormat.format(new Date(item.achievement_date))}
          </time>
        )}
      </header>
      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        {image ? (
          <Image src={image} alt={item.title} fill priority unoptimized
            sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <Trophy className="size-14" aria-hidden />
          </div>
        )}
      </div>
      <div className="mt-10 text-base leading-8 whitespace-pre-line text-foreground">{item.description}</div>
    </article>
  );
}
