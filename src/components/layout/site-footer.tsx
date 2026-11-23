import Link from "next/link";
import { siteDefaults } from "@/config/site";

const links = [
  { label: "Profil Sekolah", href: "/profil" },
  { label: "Berita", href: "/berita" },
  { label: "PPDB/SPMB", href: "/ppdb" },
  { label: "Kontak", href: "/kontak" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-lg font-bold">{siteDefaults.name}</p>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/80">
            Alamat, kontak, dan media sosial akan tampil dari pengaturan sekolah.
          </p>
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
        © {new Date().getFullYear()} {siteDefaults.name}. Hak cipta dilindungi.
      </div>
    </footer>
  );
}
