import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Megaphone } from "lucide-react";
import { getPublicAnnouncements, getPublicAnnouncementBySlug } from "@/features/content/public-queries";
import { env } from "@/lib/env";
import { buildPublicUrl } from "@/lib/storage/urls";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export async function generateStaticParams() {
  const items = await getPublicAnnouncements();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicAnnouncementBySlug(slug);
  if (!item) return { title: "Pengumuman tidak ditemukan" };
  return { title: item.title, description: item.summary || item.content.slice(0, 160) };
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublicAnnouncementBySlug(slug);
  if (!item) notFound();
  const attachment = item.attachment_path
    ? buildPublicUrl(env.NEXT_PUBLIC_SUPABASE_URL, "public-docs", item.attachment_path)
    : null;

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link href="/pengumuman" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" aria-hidden /> Semua pengumuman</Link>
      <header className="mt-8">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Megaphone className="size-4" aria-hidden /> Pengumuman resmi</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{item.title}</h1>
        <time dateTime={item.published_at} className="mt-4 block text-sm text-muted-foreground">Diterbitkan {dateFormat.format(new Date(item.published_at))}</time>
        {item.expires_at && <p className="mt-1 text-sm text-muted-foreground">Berlaku sampai {dateFormat.format(new Date(item.expires_at))}</p>}
      </header>
      {item.summary && <p className="mt-8 rounded-xl bg-muted p-5 text-base leading-relaxed">{item.summary}</p>}
      <div className="mt-8 text-base leading-8 whitespace-pre-line">{item.content}</div>
      {attachment && (
        <div className="mt-10 rounded-2xl border border-border p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><FileText className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1"><h2 className="font-semibold">Lampiran pengumuman</h2><p className="text-sm text-muted-foreground">Dokumen PDF resmi sekolah</p></div>
            <a href={attachment} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Download className="size-4" aria-hidden /> Unduh</a>
          </div>
        </div>
      )}
    </article>
  );
}
