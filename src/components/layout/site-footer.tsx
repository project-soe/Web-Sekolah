import Link from "next/link";
import { getSchoolSettings } from "@/features/school/queries";
import { siteDefaults } from "@/config/site";

const links = [
  { label: "Profil Sekolah", href: "/profil" },
  { label: "Berita", href: "/berita" },
  { label: "PPDB/SPMB", href: "/ppdb" },
  { label: "Portal Siswa", href: "/portal/daftar" },
  { label: "Kontak", href: "/kontak" },
];

export async function SiteFooter() {
  const s = await getSchoolSettings();
  const name = s?.name ?? siteDefaults.name;
  const address = [s?.address, s?.kecamatan, s?.kabupaten_kota, s?.provinsi, s?.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-lg font-bold">{name}</p>
          {s?.slogan && <p className="mt-1 text-sm text-primary-foreground/80">{s.slogan}</p>}
          <address className="mt-3 flex max-w-sm flex-col gap-1 text-sm text-primary-foreground/80 not-italic">
            {address ? <span>{address}</span> : <span>Alamat belum diisi.</span>}
            {s?.phone && <span>Telp: {s.phone}</span>}
            {s?.email && (
              <a href={`mailto:${s.email}`} className="hover:underline">
                {s.email}
              </a>
            )}
          </address>
        </div>
        <nav aria-label="Tautan penting">
          <p className="text-sm font-semibold">Tautan penting</p>
          <ul className="mt-2 grid gap-1 text-sm text-primary-foreground/80">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-block py-1 hover:text-primary-foreground hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-primary-foreground/15 px-4 py-4 text-center text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} {name}. Hak cipta dilindungi.
      </div>
    </footer>
  );
}
