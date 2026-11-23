import type { Metadata } from "next";
import { Mail, MapPin, Phone, Globe, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { siteDefaults } from "@/config/site";
import { getSchoolSettings } from "@/features/school/queries";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolSettings();
  return {
    title: "Kontak",
    description: `Informasi alamat dan kontak resmi ${school?.name ?? siteDefaults.name}.`,
  };
}

export default async function ContactPage() {
  const school = await getSchoolSettings();
  const name = school?.name ?? siteDefaults.name;
  const address = [
    school?.address,
    school?.kecamatan,
    school?.kabupaten_kota,
    school?.provinsi,
    school?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
  const whatsapp = school?.whatsapp?.replace(/[^\\d]/g, "");

  const contacts = [
    school?.phone
      ? { label: "Telepon", value: school.phone, href: `tel:${school.phone.replace(/[^+\\d]/g, "")}`, icon: Phone }
      : null,
    school?.email
      ? { label: "Email", value: school.email, href: `mailto:${school.email}`, icon: Mail }
      : null,
    school?.website
      ? { label: "Website", value: school.website, href: school.website, icon: Globe }
      : null,
    whatsapp
      ? { label: "WhatsApp", value: school.whatsapp!, href: `https://wa.me/${whatsapp}`, icon: MessageCircle }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <p className="text-sm font-semibold tracking-widest text-primary-foreground/70 uppercase">
            Terhubung Dengan Kami
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Kontak Sekolah</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-primary-foreground/80">
            Hubungi {name} melalui informasi kontak resmi berikut.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-2 md:py-16">
        <Card className="border-border/80 shadow-none">
          <CardContent className="p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <MapPin className="size-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-bold">Alamat</h2>
            {address ? (
              <>
                <p className="mt-3 leading-relaxed text-muted-foreground">{address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-10 items-center font-semibold text-primary hover:underline"
                >
                  Lihat di Google Maps
                </a>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Alamat sekolah belum dilengkapi.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-none">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold">Informasi Kontak</h2>
            {contacts.length ? (
              <ul className="mt-4 space-y-4">
                {contacts.map(({ label, value, href, icon: Icon }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <a
                        href={href}
                        target={label === "Website" || label === "WhatsApp" ? "_blank" : undefined}
                        rel={label === "Website" || label === "WhatsApp" ? "noopener noreferrer" : undefined}
                        className="mt-1 block break-all font-medium hover:text-primary hover:underline"
                      >
                        {value}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Informasi kontak belum dilengkapi oleh pengelola sekolah.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
