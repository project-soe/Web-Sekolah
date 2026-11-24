import type { Metadata } from "next";
import Image from "next/image";
import { Building2, Dumbbell, FlaskConical, MapPin, Users } from "lucide-react";
import { getPublicFacilities } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Fasilitas Sekolah",
  description: "Informasi gedung, ruang, laboratorium, dan fasilitas pendukung sekolah.",
};
export const revalidate = 300;

const labels: Record<string,string> = {
  gedung:"Gedung", ruang:"Ruang", laboratorium:"Laboratorium",
  olahraga:"Olahraga", ibadah:"Tempat ibadah", lainnya:"Lainnya",
};
const icons = { gedung: Building2, ruang: Building2, laboratorium: FlaskConical, olahraga: Dumbbell, ibadah: Building2, lainnya: Building2 };

export default async function FacilitiesPage() {
  const facilities = await getPublicFacilities();
  const counts = facilities.reduce<Record<string,number>>((acc,item) => {
    acc[item.facility_type] = (acc[item.facility_type] ?? 0) + 1; return acc;
  }, {});
  return <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
    <header className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-bold tracking-widest text-primary uppercase">Sarana dan Prasarana</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Fasilitas Sekolah</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">Kenali fasilitas yang mendukung kegiatan belajar, praktik, dan aktivitas warga sekolah.</p>
    </header>
    {facilities.length > 0 && <section aria-label="Statistik fasilitas" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Object.entries(labels).filter(([key]) => counts[key]).map(([key,label]) => <div key={key} className="rounded-xl border border-border bg-card p-4 text-center"><p className="text-2xl font-bold tabular-nums">{counts[key]}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
    </section>}
    {facilities.length === 0 ? <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center"><Building2 className="mx-auto size-10 text-muted-foreground" aria-hidden /><h2 className="mt-4 text-lg font-semibold">Informasi fasilitas belum tersedia</h2><p className="mt-2 text-sm text-muted-foreground">Fasilitas akan ditampilkan setelah dilengkapi dan dipublikasikan pengelola sekolah.</p></div> :
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{facilities.map(item => {
        const image = publicMediaUrl(item.image_path);
        const Icon = icons[item.facility_type as keyof typeof icons] ?? Building2;
        return <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative aspect-[16/9] bg-muted">{image ? <Image src={image} alt={item.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : <div className="grid size-full place-items-center text-muted-foreground"><Icon className="size-12" aria-hidden /></div>}</div>
          <div className="p-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{labels[item.facility_type] ?? "Lainnya"}</span>{item.capacity && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" aria-hidden />{item.capacity} orang</span>}</div>
            <h2 className="mt-3 text-xl font-bold">{item.name}</h2>{item.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden />{item.location}</p>}
            {item.description && <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
          </div>
        </article>;
      })}</div>}
  </div>;
}
