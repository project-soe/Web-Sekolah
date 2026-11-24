import type { Metadata } from "next";
import Link from "next/link";
import { TeacherEditor } from "@/features/content/teacher-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tambah Guru" };
export const dynamic = "force-dynamic";

export default async function CreateTeacherPage() {
  const session = await requirePermission("teachers:create");
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("id, name")
    .eq("is_published", true).order("name");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/guru" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke guru</Link>
      <h1 className="mt-3 text-2xl font-bold">Tambah Guru</h1><p className="mt-1 text-sm text-muted-foreground">Data baru disimpan tersembunyi sampai dipublikasikan oleh petugas berwenang.</p></div>
    <TeacherEditor departments={data ?? []} canPublish={can(session.access, "teachers:publish")} />
  </div>;
}
