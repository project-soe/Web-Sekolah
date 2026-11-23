import type { Metadata } from "next";
import { DEFAULT_THEME } from "@/features/settings/theme-schema";
import { ThemeForm } from "@/features/settings/theme-form";
import { getTheme } from "@/features/settings/theme-queries";
import { requirePermission } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings:update");
  const theme = (await getTheme()) ?? DEFAULT_THEME;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <ThemeForm initial={{ ...theme }} />
    </div>
  );
}
