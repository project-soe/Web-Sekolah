import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MapPin,
  UserRound,
  Phone,
  School,
  Target,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteDefaults } from "@/config/site";
import { getSchoolProfile } from "@/features/school/profile-queries";
import { getSchoolSettings } from "@/features/school/queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSettings();
  const name = school?.name ?? siteDefaults.name;
  return {
    title: { absolute: name },
    description:
      school?.slogan ??
      `Website resmi ${name}. Kenali profil, lingkungan belajar, dan informasi pendidikan sekolah.`,
  };
}

export default async function HomePage() {
  const [school, profile] = await Promise.all([
    getSchoolSettings(),
    getSchoolProfile(),
  ]);

  const name = school?.name ?? siteDefaults.name;
  const hero = publicMediaUrl(school?.hero_image_path);
  const address = [
    school?.address,
    school?.kecamatan,
    school?.kabupaten_kota,
    school?.provinsi,
  ]
    .filter(Boolean)
    .join(", ");
  const phone = school?.whatsapp || school?.phone;
  const phoneHref = phone ? `tel:${phone.replace(/[^+\\d]/g, "")}` : null;
  const intro =
    profile?.history?.trim() ||
    profile?.headmaster_message?.trim() ||
    `Selamat datang di website resmi ${name}. Temukan informasi mengenai identitas, visi, misi, dan berbagai informasi sekolah melalui halaman ini.`;

  return (
    <div className="overflow-hidden">
      <section className="relative isolate flex min-h-[min(760px,calc(100svh-4rem))] items-center bg-primary text-primary-foreground">
        {hero && (
          <Image
            src={hero}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="-z-20 object-cover"
          />
        )}
        <div className="-z-10 absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/55" />
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,.8fr)] md:items-center md:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground/90">
              <School className="size-4" aria-hidden />
              Website Resmi Sekolah
            </p>
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl md:text-6xl">
              {name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 md:text-xl">
              {school?.slogan ||
                "Membangun lingkungan belajar yang mendukung tumbuh dan berkembangnya generasi masa depan."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/profil"
                className={buttonVariants({
                  size: "lg",
                  variant: "secondary",
                  className: "gap-2",
                })}
              >
                Kenali Sekolah <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/ppdb"
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
                })}
              >
                Informasi PPDB
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-auto max-w-sm rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-5 grid size-12 place-items-center rounded-xl bg-primary-foreground/15">
                <GraduationCap className="size-6" aria-hidden />
              </div>
              <p className="text-sm font-semibold tracking-wide text-primary-foreground/70">
                MENGENAL SEKOLAH
              </p>
              <p className="mt-2 text-2xl font-bold">
                Pendidikan, karakter, dan masa depan.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                Jelajahi informasi resmi sekolah, mulai dari profil hingga layanan pendidikan.
              </p>
              <Link
                href="/profil"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:underline"
              >
                Lihat profil lengkap <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-16 bg-gradient-to-t from-background/10 to-transparent" />
      </section>

      <section aria-label="Informasi singkat sekolah" className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <UserRound className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Kepala sekolah</p>
              <p className="mt-1 font-semibold">{school?.headmaster_name || "Informasi belum tersedia"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <School className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Jenjang pendidikan</p>
              <p className="mt-1 font-semibold">{school?.education_level || "Informasi belum tersedia"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Akreditasi</p>
              <p className="mt-1 font-semibold">{school?.accreditation || "Informasi belum tersedia"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Lokasi sekolah</p>
              <p className="mt-1 font-semibold">{address || "Alamat belum diisi"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-[.8fr_1.2fr] md:items-center md:py-28">
        <div>
          <p className="text-sm font-bold tracking-widest text-primary uppercase">Tentang Kami</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Mengenal lebih dekat {name}
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            {intro.length > 520 ? `${intro.slice(0, 517).trimEnd()}…` : intro}
          </p>
          <Link
            href="/profil"
            className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
          >
            Selengkapnya tentang sekolah <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="h-full border-border/80 shadow-none">
            <CardContent className="p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Target className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-bold">Visi</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">
                {profile?.vision || "Visi sekolah akan ditampilkan setelah dilengkapi oleh pengelola."}
              </p>
            </CardContent>
          </Card>
          <Card className="h-full border-border/80 bg-muted/60 shadow-none sm:translate-y-8">
            <CardContent className="p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-background text-primary">
                <BookOpen className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-bold">Misi</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line">
                {profile?.mission || "Misi sekolah akan ditampilkan setelah dilengkapi oleh pengelola."}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-widest text-primary uppercase">Informasi Sekolah</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Ingin mengenal sekolah lebih jauh?</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Kunjungi halaman profil atau hubungi sekolah untuk mendapatkan informasi lebih lanjut.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/profil" className={buttonVariants({ size: "lg" })}>
              Profil Sekolah
            </Link>
            {phoneHref && (
              <a href={phoneHref} className={buttonVariants({ size: "lg", variant: "outline" })}>
                <Phone className="size-4" aria-hidden /> Hubungi Sekolah
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
