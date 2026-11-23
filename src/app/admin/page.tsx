import { EmptyState } from "@/components/ui/states";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <EmptyState
        title="Statistik belum tersedia"
        description="Dashboard akan menampilkan data dari database setelah modul terkait selesai."
      />
    </div>
  );
}
