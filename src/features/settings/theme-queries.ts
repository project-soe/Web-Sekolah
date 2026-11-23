import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { themeSchema, type Theme } from "./theme-schema";

/** Mengembalikan null bila belum diatur atau datanya tidak valid (situs memakai warna bawaan). */
export const getTheme = cache(async (): Promise<Theme | null> => {
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("value")
      .eq("key", "theme.colors")
      .eq("is_public", true)
      .maybeSingle();
    if (error || !data) return null;
    const parsed = themeSchema.safeParse(data.value);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
});
