import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Dashboard Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <AdminShell email={session.email} access={session.access}>{children}</AdminShell>;
}
