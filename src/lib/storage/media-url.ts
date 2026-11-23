import { env } from "@/lib/env";
import { buildPublicUrl } from "./urls";

export function publicMediaUrl(path: string | null | undefined) {
  return path ? buildPublicUrl(env.NEXT_PUBLIC_SUPABASE_URL, "media", path) : null;
}
