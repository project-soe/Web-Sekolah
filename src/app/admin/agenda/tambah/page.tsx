import type { Metadata } from "next";
import Link from "next/link";
import { EventEditor } from "@/features/content/event-editor";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/rbac/access";

export const metadata: Metadata = { title: "Tambah Agenda" };
export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  const session = await requirePermission("events:create");
  return <div className="flex flex-col gap-6">
    <div><Link href="/admin/agenda" className="text-sm text-muted-foreground hover:text-primary">← Kembali ke agenda</Link>
      <h1 className="mt-3 text-2xl font-bold">Tambah Agenda</h1><p className="mt-1 text-sm text-muted-foreground">Simpan sebagai draft atau jadwalkan publikasi.</p></div>
    <EventEditor canPublish={can(session.access, "events:publish")} />
  </div>;
}
