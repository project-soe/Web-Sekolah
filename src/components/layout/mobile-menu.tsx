"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { NavLink } from "./nav-link";

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </Button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu utama"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background p-3 shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const isPortal = item.href === "/portal/daftar";
              const isTeacherLogin = item.href === "/guru/masuk";
              return (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={isPortal ? "flex min-h-11 items-center rounded-lg bg-amber-500 px-3 text-base font-semibold text-slate-950 hover:bg-amber-400" : isTeacherLogin ? "flex min-h-11 items-center rounded-lg border border-primary/30 px-3 text-base font-semibold text-primary hover:bg-primary/5" : "flex min-h-11 items-center rounded-lg px-3 text-base hover:bg-muted"}
                    activeClassName={isPortal ? "ring-2 ring-amber-600 ring-offset-1" : "bg-secondary font-semibold"}
                  >
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
