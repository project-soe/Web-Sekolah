import { EmptyState } from "@/components/ui/states";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <EmptyState
        title="Statistik belum tersedia"
        description="Dashboard akan menampilkan data dari database setelah database dan autentikasi selesai (Fase 2 dan 3)."
      />
    </div>
  );
}
