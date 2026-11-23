import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, GraduationCap } from "lucide-react";
import { getPublicDepartments } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Program Keahlian dan Jurusan",
  description: "Informasi program keahlian dan jurusan yang tersedia di sekolah.",
};

export const revalidate = 300;

export default async function DepartmentsPage() {
  const departments = await getPublicDepartments();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">
          Pilihan Pendidikan
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Program Keahlian dan Jurusan
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Temukan program pendidikan dan bidang keahlian yang dikembangkan di sekolah.
        </p>
      </header>

      {departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Informasi jurusan belum tersedia</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Program keahlian akan ditampilkan setelah dilengkapi dan dipublikasikan oleh pengelola sekolah.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => {
            const image = publicMediaUrl(department.image_path);
            return (
              <article
                key={department.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[16/9] bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={`Ilustrasi ${department.name}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <GraduationCap className="size-12" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold">{department.name}</h2>
                  {department.description ? (
                    <p className="mt-3 line-clamp-5 text-sm leading-relaxed text-muted-foreground">
                      {department.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Informasi program akan segera dilengkapi.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
