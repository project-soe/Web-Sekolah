/** Menentukan apakah `href` aktif untuk `pathname`. Beranda dan dashboard admin harus persis sama. */
export function isActivePath(pathname: string, href: string) {
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
