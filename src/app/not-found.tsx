import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center p-6">
      <EmptyState
        title="Halaman tidak ditemukan"
        description="Halaman yang kamu cari belum tersedia atau sudah dipindahkan."
        action={
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Kembali ke beranda
          </Link>
        }
      />
    </main>
  );
}
