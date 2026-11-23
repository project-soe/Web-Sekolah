import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { getPublicEvents } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Agenda Sekolah",
  description: "Jadwal kegiatan dan agenda resmi sekolah.",
};
export const revalidate = 300;

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EventsPage() {
  const events = await getPublicEvents();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">Jadwal Kegiatan</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Agenda Sekolah</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Informasi kegiatan, acara, dan jadwal penting yang diselenggarakan sekolah.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Belum ada agenda mendatang</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Agenda kegiatan akan ditampilkan setelah diterbitkan oleh pengelola sekolah.
          </p>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((item) => {
            const image = publicMediaUrl(item.image_path);
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Link href={`/agenda/${item.slug}`} className="group block">
                  <div className="relative aspect-[16/9] bg-muted">
                    {image ? (
                      <Image src={image} alt={item.title} fill unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <CalendarDays className="size-12" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-sm font-semibold text-primary">
                      {dateFormat.format(new Date(item.starts_at))}
                    </p>
                    <h2 className="mt-3 text-xl font-bold leading-snug group-hover:text-primary">{item.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {item.summary || item.description}
                    </p>
                    {item.location && (
                      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4 shrink-0" aria-hidden /> {item.location}
                      </p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Detail agenda <ArrowRight className="size-4" aria-hidden />
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
