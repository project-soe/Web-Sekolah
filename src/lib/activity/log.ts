import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityAction =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "publish"
  | "verify"
  | "status_change"
  | "export"
  | "import"
  | "upload";

export type ActivityEntry = {
  action: ActivityAction;
  module: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  /** Hanya data non-sensitif. Jangan pernah mengirim password, token, NIK, atau isi dokumen. */
  changes?: Record<string, unknown>;
};

/** Best-effort: kegagalan log tidak membatalkan operasi utama. */
export async function logActivity(supabase: SupabaseClient, entry: ActivityEntry) {
  const { error } = await supabase.rpc("log_activity", {
    p_action: entry.action,
    p_module: entry.module,
    p_summary: entry.summary,
    p_entity_type: entry.entityType ?? null,
    p_entity_id: entry.entityId ?? null,
    p_changes: entry.changes ?? null,
  });
  if (error) console.error("activity_log_failed", error.code);
}
