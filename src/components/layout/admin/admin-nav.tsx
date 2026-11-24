"use client";

import { adminNav } from "@/config/navigation";
import type { Access } from "@/lib/rbac/access";
import { can } from "@/lib/rbac/access";
import { NavLink } from "../nav-link";

const implementedRoutes = new Set([
  "/admin",
  "/admin/identitas",
  "/admin/profil",
  "/admin/pengaturan",
  "/admin/berita",
  "/admin/pengumuman",
  "/admin/galeri",
  "/admin/prestasi",
]);

const permissionByHref: Record<string, string> = {
  "/admin/identitas": "school:update",
  "/admin/profil": "school:update",
  "/admin/guru": "teachers:view",
  "/admin/jurusan": "departments:view",
  "/admin/berita": "news:view",
  "/admin/kategori-berita": "news:view",
  "/admin/pengumuman": "announcements:view",
  "/admin/galeri": "galleries:view",
  "/admin/prestasi": "achievements:view",
  "/admin/agenda": "events:view",
};

export function AdminNav({
  onNavigate,
  access,
}: {
  onNavigate?: () => void;
  access: Access;
}) {
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {adminNav.map((group) => {
        const items = group.items.filter((item) => {
          if (!implementedRoutes.has(item.href)) return false;
          const permission = permissionByHref[item.href];
          return !permission || can(access, permission);
        });
        if (items.length === 0) return null;
        return (
          <div key={group.group}>
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.group}
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <NavLink
                    href={href}
                    onClick={onNavigate}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                    activeClassName="bg-secondary font-semibold text-secondary-foreground"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
