import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/states";
import { siteDefaults } from "@/config/site";
import { getSchoolProfile } from "@/features/school/profile-queries";
import { getSchoolSettings } from "@/features/school/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSchoolSettings();
  return { title: "Profil Sekolah", description: `Profil ${s?.name ?? siteDefaults.name}` };
}

export default async function ProfilePage() {
  const [s, p] = await Promise.all([getSchoolSettings(), getSchoolProfile()]);

  const address = [s?.address, s?.kecamatan, s?.kabupaten_kota, s?.provinsi, s?.postal_code]
    .filter(Boolean)
    .join(", ");

  const rows: [string, string | null | undefined][] = [
    ["NPSN", s?.npsn],
    ["NSS", s?.nss],
    ["Status", s?.ownership ? (s.ownership === "negeri" ? "Negeri" : "Swasta") : null],
    ["Jenjang", s?.education_level],
    ["Akreditasi", s?.accreditation],
    ["Tahun berdiri", s?.founded_year ? String(s.founded_year) : null],
    ["Kepala sekolah", s?.headmaster_name],
    ["Alamat", address || null],
    ["Telepon", s?.phone],
    ["Email", s?.email],
    ["Website", s?.website],
  ];
  const info = rows.filter(([, v]) => !!v) as [string, string][];

  const sections: [string, string | null | undefined][] = [
    ["Sambutan Kepala Sekolah", p?.headmaster_message],
    ["Visi", p?.vision],
    ["Misi", p?.mission],
    ["Sejarah", p?.history],
    ["Tujuan Pendidikan", p?.objectives],
  ];
  const filled = sections.filter(([, v]) => !!v) as [string, string][];

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Profil {s?.name ?? siteDefaults.name}</h1>

      {info.length === 0 && filled.length === 0 && (
        <EmptyState
          title="Profil sekolah belum diisi"
          description="Informasi profil akan tampil di sini setelah dilengkapi oleh admin sekolah."
        />
      )}

      {info.length > 0 && (
        <section aria-labelledby="data-sekolah">
          <h2 id="data-sekolah" className="mb-3 text-xl font-semibold">
            Data Sekolah
          </h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
            {info.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-medium text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {filled.map(([title, text]) => (
        <section key={title}>
          <h2 className="mb-2 text-xl font-semibold">{title}</h2>
          <p className="leading-relaxed whitespace-pre-line">{text}</p>
        </section>
      ))}
    </article>
  );
}
