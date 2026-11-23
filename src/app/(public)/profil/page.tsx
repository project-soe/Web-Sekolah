import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, GraduationCap, MapPin, Phone, Target } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { siteDefaults } from "@/config/site";
import { getSchoolProfile } from "@/features/school/profile-queries";
import { getSchoolSettings } from "@/features/school/queries";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSchoolSettings();
  const name = s?.name ?? siteDefaults.name;
  return {
    title: "Profil Sekolah",
    description: `Kenali identitas, sejarah, visi, misi, dan informasi resmi ${name}.`,
  };
}

export default async function ProfilePage() {
  const [s, p] = await Promise.all([getSchoolSettings(), getSchoolProfile()]);
  const name = s?.name ?? siteDefaults.name;
  const address = [s?.address, s?.kecamatan, s?.kabupaten_kota, s?.provinsi, s?.postal_code]
    .filter(Boolean)
    .join(", ");

  const rows: [string, string | null | undefined][] = [
    ["NPSN", s?.npsn],
    ["NSS", s?.nss],
    ["Status", s?.ownership ? (s.ownership === "negeri" ? "Negeri" : "Swasta") : null],
    ["Jenjang", s?.education_level],
    ["Akreditasi", s?.accreditation],
    ["Tahun berdiri", s?.founded_year ? String(s.founded_year) : null],
    ["Kepala sekolah", s?.headmaster_name],
    ["Alamat", address || null],
    ["Telepon", s?.phone],
    ["Email", s?.email],
    ["Website", s?.website],
  ];
  const info = rows.filter(([, value]) => Boolean(value)) as [string, string][];

  const sections = [
    { title: "Sambutan Kepala Sekolah", value: p?.headmaster_message, icon: GraduationCap },
    { title: "Sejarah Sekolah", value: p?.history, icon: Building2 },
    { title: "Visi", value: p?.vision, icon: Target },
    { title: "Misi", value: p?.mission, icon: BookOpen },
    { title: "Tujuan Pendidikan", value: p?.objectives, icon: GraduationCap },
  ];
  const filled = sections.filter((section) => Boolean(section.value?.trim()));
  const hasContent = info.length > 0 || filled.length > 0;

  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex min-h-10 items-center gap-2 text-sm text-primary-foreground/75 hover:text-primary-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Beranda
          </Link>
          <p className="text-sm font-semibold tracking-widest text-primary-foreground/70 uppercase">
            Tentang Kami
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            Profil {name}
          </h1>
          {s?.slogan && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
              {s.slogan}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:py-16">
        <div className="min-w-0 space-y-8">
          {!hasContent && (
            <EmptyState
              title="Profil sekolah belum diisi"
              description="Informasi profil akan tampil di sini setelah dilengkapi oleh admin sekolah."
            />
          )}

          {filled.map(({ title, value, icon: Icon }) => (
            <section key={title} aria-labelledby={`section-${title}`}>
              <div className="mb-4 flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 id={`section-${title}`} className="text-2xl font-bold tracking-tight">
                  {title}
                </h2>
              </div>
              <Card className="border-border/80 shadow-none">
                <CardContent className="p-5 md:p-7">
                  <p className="leading-8 whitespace-pre-line text-muted-foreground">{value}</p>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          {info.length > 0 && (
            <Card className="h-fit border-border/80 shadow-none">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                    <Building2 className="size-5" aria-hidden />
                  </span>
                  <h2 className="text-lg font-bold">Identitas Sekolah</h2>
                </div>
                <dl className="space-y-4">
                  {info.map(([label, value]) => (
                    <div key={label} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {(address || s?.phone || s?.email || s?.website) && (
            <Card className="border-border/80 bg-muted/60 shadow-none">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold">Hubungi Kami</h2>
                {address && (
                  <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {address}
                  </p>
                )}
                {s?.phone && (
                  <a href={`tel:${s.phone.replace(/[^+\\d]/g, "")}`} className="mt-3 flex min-h-10 items-center gap-2 text-sm hover:text-primary hover:underline">
                    <Phone className="size-4" aria-hidden /> {s.phone}
                  </a>
                )}
                {s?.email && (
                  <a href={`mailto:${s.email}`} className="mt-2 block break-all text-sm hover:text-primary hover:underline">
                    {s.email}
                  </a>
                )}
                {s?.website && (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-sm hover:text-primary hover:underline">
                    {s.website}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Link href="/kontak" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Informasi Kontak Lengkap
          </Link>
        </aside>
      </div>
    </div>
  );
}
