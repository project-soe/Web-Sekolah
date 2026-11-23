import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { publicNav } from "@/config/navigation";
import { siteDefaults } from "@/config/site";
import { MobileMenu } from "./mobile-menu";
import { SearchToggle } from "./search-toggle";
import { NavDropdown } from "./nav-dropdown";
import { NavLink } from "./nav-link";

const primary = publicNav.slice(0, 6);
const more = publicNav.slice(6).filter((i) => i.href !== "/ppdb");

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-primary">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"
          >
            <GraduationCap className="size-5" />
          </span>
          <span className="truncate">{siteDefaults.name}</span>
        </Link>

        <nav aria-label="Menu utama" className="ml-auto hidden items-center gap-1 lg:flex">
          {primary.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-muted"
              activeClassName="bg-secondary text-secondary-foreground"
            >
              {item.label}
            </NavLink>
          ))}
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
