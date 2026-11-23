"use client";

import { adminNav } from "@/config/navigation";
import { NavLink } from "../nav-link";

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {adminNav.map((group) => (
        <div key={group.group}>
          <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ href, label, icon: Icon }) => (
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
      ))}
    </nav>
  );
}
