import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { SchoolProfile } from "./types";

export const getSchoolProfile = cache(async (): Promise<SchoolProfile | null> => {
  const { data, error } = await createPublicClient()
    .from("school_profiles")
    .select("vision, mission, history, objectives, headmaster_message")
    .maybeSingle();
  if (error) {
    console.error("school_profile_failed", error.code);
    return null;
  }
  return data as SchoolProfile | null;
});
