import { GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { publicNav } from "@/config/navigation";
import { siteDefaults } from "@/config/site";
import { getSchoolSettings } from "@/features/school/queries";
import { publicMediaUrl } from "@/lib/storage/media-url";
import { MobileMenu } from "./mobile-menu";
import { NavDropdown } from "./nav-dropdown";
import { NavLink } from "./nav-link";
import { SearchToggle } from "./search-toggle";

const primary = publicNav.slice(0, 6);
const more = publicNav.slice(6).filter((i) => i.href !== "/ppdb");

export async function SiteHeader() {
  const settings = await getSchoolSettings();
  const name = settings?.name ?? siteDefaults.name;
  const logo = publicMediaUrl(settings?.logo_path);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-primary">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="size-9 shrink-0 object-contain"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
            >
              <GraduationCap className="size-5" />
            </span>
          )}
          <span className="truncate">{name}</span>
        </Link>

        <nav aria-label="Menu utama" className="ml-auto hidden items-center gap-1 lg:flex">
          {primary.map((item) => {
            const isPortal = item.href === "/portal/daftar";
            return (
              <NavLink
                key={item.href}
                href={item.href}
                className={isPortal ? "inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-amber-400" : "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted"}
                activeClassName={isPortal ? "ring-2 ring-amber-600 ring-offset-1" : "bg-secondary text-secondary-foreground"}
              >
                {item.label}
              </NavLink>
            );
          })}
          <NavDropdown label="Lainnya" items={more} />
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <SearchToggle />
          <Link
            href="/ppdb"
            className={buttonVariants({ size: "md", className: "hidden sm:inline-flex" })}
          >
            Daftar PPDB
          </Link>
          <MobileMenu items={publicNav} />
        </div>
      </div>
    </header>
  );
}
