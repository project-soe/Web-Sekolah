import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { accessSchema, can, type Access } from "@/lib/rbac/access";

export async function fetchAccess(supabase: SupabaseClient): Promise<Access | null> {
  const { error, data } = await supabase.rpc("my_access");
  if (error) return null;
  const parsed = accessSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Sesi valid = akun terautentikasi (divalidasi server Auth), aktif, dan punya minimal satu role. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const access = await fetchAccess(supabase);
  if (!access || access.roles.length === 0) return null;
  return { userId: user.id, email: user.email ?? "", access };
});

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePermission(code: string) {
  const session = await requireAdmin();
  if (!can(session.access, code)) redirect("/admin?akses=ditolak");
  return session;
}
