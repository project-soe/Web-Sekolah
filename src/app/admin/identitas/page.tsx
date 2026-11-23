import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/states";
import { IdentityForm } from "@/features/school/identity-form";
import { getSchoolSettings } from "@/features/school/queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Identitas Sekolah" };
export const dynamic = "force-dynamic";

export default async function IdentityPage() {
  await requirePermission("school:update");
  const settings = await getSchoolSettings();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Identitas Sekolah</h1>
      {settings ? (
        <IdentityForm initial={settings} />
      ) : (
        <ErrorState
          title="Gagal memuat identitas"
          description="Muat ulang halaman atau coba beberapa saat lagi."
        />
      )}
    </div>
  );
}
