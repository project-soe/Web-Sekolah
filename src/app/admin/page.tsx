import { EmptyState } from "@/components/ui/states";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ akses?: string }>;
}) {
  const { akses } = await searchParams;
  await requireAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {akses === "ditolak" && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          Anda tidak memiliki akses ke halaman tersebut.
        </p>
      )}
      <EmptyState
        title="Statistik belum tersedia"
        description="Dashboard akan menampilkan data dari database setelah modul terkait selesai."
      />
    </div>
  );
}
