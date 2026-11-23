import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteDefaults } from "@/config/site";

// Sementara. Diganti homepage dinamis (hero, statistik, berita, dll.) di Fase 6.
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
        {siteDefaults.name}
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Konten halaman ini akan diambil dari database setelah modul terkait selesai dibangun.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/ppdb" className={buttonVariants({ size: "lg" })}>
          Daftar Sekarang
        </Link>
        <Link href="/profil" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Jelajahi Sekolah
        </Link>
      </div>
    </section>
  );
}
