import type { Metadata } from "next";
import { ErrorState } from "@/components/ui/states";
import { ImageUploader } from "@/features/school/image-uploader";
import { IdentityForm } from "@/features/school/identity-form";
import { getSchoolSettings } from "@/features/school/queries";
import { requirePermission } from "@/lib/auth/session";
import { publicMediaUrl } from "@/lib/storage/media-url";

export const metadata: Metadata = { title: "Identitas Sekolah" };
export const dynamic = "force-dynamic";

export default async function IdentityPage() {
  await requirePermission("school:update");
  const settings = await getSchoolSettings();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Identitas Sekolah</h1>
      {settings ? (
        <>
          <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
            <ImageUploader
              kind="logo"
              title="Logo sekolah"
              hint="PNG atau WebP, latar transparan lebih baik."
              currentUrl={publicMediaUrl(settings.logo_path)}
              maxDim={512}
              previewClass="aspect-square w-full max-w-48"
            />
            <ImageUploader
              kind="hero"
              title="Foto utama"
              hint="Foto gedung atau kegiatan, orientasi landscape."
              currentUrl={publicMediaUrl(settings.hero_image_path)}
              maxDim={1920}
              previewClass="aspect-video w-full"
            />
          </div>
          <IdentityForm initial={settings} />
        </>
      ) : (
        <ErrorState
          title="Gagal memuat identitas"
          description="Muat ulang halaman atau coba beberapa saat lagi."
        />
      )}
    </div>
  );
}
