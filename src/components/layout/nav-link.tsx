"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { isActivePath } from "@/utils/paths";

type NavLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  activeClassName?: string;
};

export function NavLink({ href, className, activeClassName, ...props }: NavLinkProps) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
      {...props}
    />
  );
}
