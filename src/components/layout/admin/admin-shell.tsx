"use client";

import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { siteDefaults } from "@/config/site";
import { logout } from "@/features/auth/actions";
import { cn } from "@/utils/cn";
import type { Access } from "@/lib/rbac/access";
import { AdminNav } from "./admin-nav";
import { Breadcrumbs } from "./breadcrumbs";

export function AdminShell({ children, email, access }: { children: React.ReactNode; email: string; access: Access }) {
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
    <div className="min-h-dvh bg-muted lg:grid lg:grid-cols-[16rem_1fr]">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-border bg-background p-4 transition-transform",
          "lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <div className="mb-5 flex items-center justify-between px-3">
          <span className="truncate font-bold text-primary">{siteDefaults.name}</span>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Tutup menu admin"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <AdminNav access={access} onNavigate={() => setOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Buka menu admin"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>
          <Breadcrumbs />
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-muted"
          >
            <span className="hidden sm:inline">Lihat situs</span>
            <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only sm:hidden">Lihat situs</span>
          </Link>
          <span className="hidden max-w-48 truncate text-xs text-muted-foreground md:inline">
            {email}
          </span>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" aria-hidden />
              Keluar
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
