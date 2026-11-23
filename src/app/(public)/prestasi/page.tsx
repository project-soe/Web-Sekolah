import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { getPublicAchievements } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Prestasi Sekolah",
  description: "Berbagai pencapaian dan prestasi siswa serta sekolah.",
};
export const revalidate = 300;
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default async function AchievementsPage() {
  const achievements = await getPublicAchievements();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">Apresiasi dan Pencapaian</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Prestasi Sekolah</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Catatan pencapaian siswa, guru, dan sekolah dalam berbagai bidang dan tingkat kompetisi.
        </p>
      </header>

      {achievements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <Trophy className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Belum ada prestasi</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Informasi prestasi akan ditampilkan setelah diterbitkan oleh pengelola.
          </p>
        </div>
      ) : (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((item) => {
            const image = publicMediaUrl(item.image_path);
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <Link href={`/prestasi/${item.slug}`} className="group block">
                  <div className="relative aspect-[16/9] bg-muted">
                    {image ? (
                      <Image src={image} alt={item.title} fill unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid size-full place-items-center text-muted-foreground">
                        <Trophy className="size-12" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{item.achievement_level}</span>
                      {item.achievement_date && (
                        <time dateTime={item.achievement_date}>• {dateFormat.format(new Date(item.achievement_date))}</time>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-bold leading-snug group-hover:text-primary">{item.title}</h2>
                    {item.recipient && <p className="mt-2 text-sm font-medium">{item.recipient}</p>}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Lihat detail <ArrowRight className="size-4" aria-hidden />
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
