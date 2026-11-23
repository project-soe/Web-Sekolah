import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { getPublicEventBySlug, getPublicEvents } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function generateStaticParams() {
  const items = await getPublicEvents();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicEventBySlug(slug);
  if (!item) return { title: "Agenda tidak ditemukan" };
  const description = item.summary || item.description.slice(0, 160);
  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
      images: item.image_path ? [publicMediaUrl(item.image_path)!] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicEventBySlug(slug);
  if (!item) notFound();
  const image = publicMediaUrl(item.image_path);

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link href="/agenda" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> Semua agenda
      </Link>
      <header className="mt-8">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <CalendarDays className="size-4" aria-hidden /> Agenda sekolah
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
        {item.summary && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{item.summary}</p>}
      </header>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        {image ? (
          <Image src={image} alt={item.title} fill priority unoptimized
            sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <CalendarDays className="size-14" aria-hidden />
          </div>
        )}
      </div>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-2 sm:p-6">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 size-5 text-primary" aria-hidden />
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Waktu mulai</dt>
            <dd className="mt-1 font-medium">{dateTimeFormat.format(new Date(item.starts_at))}</dd>
            {item.ends_at && <dd className="mt-1 text-sm text-muted-foreground">Sampai {dateTimeFormat.format(new Date(item.ends_at))}</dd>}
          </div>
        </div>
        {item.location && (
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lokasi</dt>
              <dd className="mt-1 font-medium">{item.location}</dd>
            </div>
          </div>
        )}
      </dl>

      <div className="mt-10 text-base leading-8 whitespace-pre-line">{item.description}</div>

      {item.registration_url && (
        <div className="mt-10">
          <a href={item.registration_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Informasi pendaftaran
          </a>
        </div>
      )}
    </article>
  );
}
