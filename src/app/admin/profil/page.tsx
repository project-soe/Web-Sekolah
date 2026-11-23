import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/states";
import { getSchoolProfile } from "@/features/school/profile-queries";
import { ProfileForm } from "@/features/school/profile-form";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profil Sekolah" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requirePermission("school:update");
  const profile = await getSchoolProfile();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Profil Sekolah</h1>
      {profile ? (
        <ProfileForm initial={profile} />
      ) : (
        <ErrorState
          title="Gagal memuat profil"
          description="Muat ulang halaman atau coba beberapa saat lagi."
        />
      )}
    </div>
  );
}
