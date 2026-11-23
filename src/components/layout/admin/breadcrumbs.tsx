"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "@/config/navigation";

const labels = new Map<string, string>(
  adminNav.flatMap((g) => g.items.map((i) => [i.href, i.label] as [string, string])),
);

export function Breadcrumbs() {
  const parts = usePathname().split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const fallback = decodeURIComponent(part).replace(/-/g, " ");
    return { href, label: labels.get(href) ?? fallback };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
              {last ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-foreground capitalize"
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate capitalize hover:text-foreground hover:underline"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
