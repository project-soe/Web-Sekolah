import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { getPublicAnnouncements } from "@/features/content/public-queries";

export const metadata: Metadata = {
  title: "Pengumuman Sekolah",
  description: "Informasi dan pengumuman resmi dari sekolah.",
};
export const revalidate = 300;
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default async function AnnouncementsPage() {
  const announcements = await getPublicAnnouncements();
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">Informasi Resmi</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Pengumuman Sekolah</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">Informasi penting dan pemberitahuan resmi untuk peserta didik, orang tua, dan masyarakat.</p>
      </header>
      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Megaphone className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Belum ada pengumuman</h2>
          <p className="mt-2 text-sm text-muted-foreground">Pengumuman akan ditampilkan setelah diterbitkan oleh pengelola sekolah.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Megaphone className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <time dateTime={item.published_at} className="text-xs font-medium text-muted-foreground">{dateFormat.format(new Date(item.published_at))}</time>
                  <h2 className="mt-2 text-xl font-bold leading-snug">{item.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.summary || item.content}</p>
                  <Link href={`/pengumuman/${item.slug}`} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline">Baca pengumuman <ArrowRight className="size-4" aria-hidden /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
