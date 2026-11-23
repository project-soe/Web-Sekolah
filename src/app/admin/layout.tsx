import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Dashboard Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
