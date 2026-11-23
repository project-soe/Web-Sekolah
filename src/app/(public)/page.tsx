import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteDefaults } from "@/config/site";
import { getSchoolSettings } from "@/features/school/queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

// Sementara. Diganti homepage dinamis (hero 3D, statistik, berita, dll.) di Fase 6.
export default async function HomePage() {
  const settings = await getSchoolSettings();
  const name = settings?.name ?? siteDefaults.name;
  const hero = publicMediaUrl(settings?.hero_image_path);

  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      {hero && (
        <Image
          src={hero}
          alt=""
          fill
          priority
          unoptimized
          className="-z-10 object-cover opacity-35"
        />
      )}
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 md:py-28">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{name}</h1>
        {settings?.slogan && (
          <p className="max-w-xl text-lg text-primary-foreground/90">{settings.slogan}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/ppdb" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            Daftar Sekarang
          </Link>
          <Link
            href="/profil"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className:
                "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            })}
          >
            Jelajahi Sekolah
          </Link>
        </div>
      </div>
    </section>
  );
}
