import type { Metadata } from "next";
import Image from "next/image";
import { GraduationCap, UsersRound } from "lucide-react";
import { getPublicTeachers } from "@/features/content/public-queries";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = {
  title: "Guru dan Tenaga Kependidikan",
  description: "Kenali guru dan tenaga kependidikan sekolah.",
};

export const revalidate = 300;

export default async function TeachersPage() {
  const teachers = await getPublicTeachers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-widest text-primary uppercase">
          Sumber Daya Manusia
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Guru dan Tenaga Kependidikan
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Kenali para pendidik dan tenaga kependidikan yang mendukung proses
          belajar dan perkembangan peserta didik.
        </p>
      </header>

      {teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <UsersRound className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 text-lg font-semibold">Informasi guru belum tersedia</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Data akan ditampilkan setelah dilengkapi dan dipublikasikan oleh pengelola sekolah.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teachers.map((teacher) => {
            const photo = publicMediaUrl(teacher.photo_path);
            return (
              <article
                key={teacher.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={`Foto ${teacher.full_name}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <GraduationCap className="size-12" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold">{teacher.full_name}</h2>
                  {teacher.position && (
                    <p className="mt-1 text-sm font-medium text-primary">{teacher.position}</p>
                  )}
                  {teacher.department?.name && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {teacher.department.name}
                    </p>
                  )}
                  {teacher.education && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Pendidikan: {teacher.education}
                    </p>
                  )}
                  {teacher.biography && (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {teacher.biography}
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
