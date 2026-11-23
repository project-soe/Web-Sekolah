import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Pencarian", robots: { index: false } };

// Sementara. Pencarian database (full-text, autocomplete, filter) dibangun di Fase 6.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">Pencarian</h1>
      {q && <p className="mt-2 text-sm text-muted-foreground">Kata kunci: {q}</p>}
      <div className="mt-6">
        <EmptyState
          title="Pencarian belum aktif"
          description="Pencarian konten akan aktif setelah modul berita, pengumuman, dan jurusan selesai."
        />
      </div>
    </section>
  );
}
