import "server-only";
import { cache } from "react";
import { siteDefaults } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";
import type { SchoolSettings } from "./types";

export const getSchoolSettings = cache(async (): Promise<SchoolSettings | null> => {
  const { data, error } = await createPublicClient()
    .from("school_settings")
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("school_settings_failed", error.code);
    return null;
  }
  return data as SchoolSettings | null;
});

export async function getSchoolName() {
  return (await getSchoolSettings())?.name ?? siteDefaults.name;
}
