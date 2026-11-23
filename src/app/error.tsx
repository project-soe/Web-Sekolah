"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

// Pesan sengaja generik: detail error tidak boleh ditampilkan ke pengunjung.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center p-6">
      <ErrorState
        title="Terjadi kesalahan"
        description="Halaman gagal dimuat. Silakan coba lagi beberapa saat."
        action={<Button onClick={reset}>Coba lagi</Button>}
      />
    </main>
  );
}
