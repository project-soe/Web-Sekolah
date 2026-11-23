import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicDepartment = {
  id: string; name: string; slug: string; description: string | null;
  image_path: string | null; sort_order: number;
};
export type PublicTeacher = {
  id: string; full_name: string; slug: string; position: string | null;
  education: string | null; biography: string | null; photo_path: string | null;
  sort_order: number; department: { name: string } | null;
};
export type PublicNews = {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; cover_path: string | null; published_at: string;
  category: { name: string; slug: string } | null;
};
export type PublicAnnouncement = {
  id: string; title: string; slug: string; summary: string | null;
  content: string; attachment_path: string | null; published_at: string;
  expires_at: string | null;
};

export const getPublicDepartments = cache(async (): Promise<PublicDepartment[]> => {
  const { data, error } = await createPublicClient().from("departments")
    .select("id, name, slug, description, image_path, sort_order")
    .eq("is_published", true).order("sort_order").order("name");
  if (error) { console.error("public_departments_failed", error.code); return []; }
  return (data ?? []) as PublicDepartment[];
});

export const getPublicTeachers = cache(async (): Promise<PublicTeacher[]> => {
  const { data, error } = await createPublicClient().from("teachers")
    .select("id, full_name, slug, position, education, biography, photo_path, sort_order, department:departments(name)")
    .eq("is_published", true).order("sort_order").order("full_name");
  if (error) { console.error("public_teachers_failed", error.code); return []; }
  return (data ?? []) as unknown as PublicTeacher[];
});

const newsSelection = "id, title, slug, excerpt, content, cover_path, published_at, category:news_categories(name, slug)";
const announcementSelection = "id, title, slug, summary, content, attachment_path, published_at, expires_at";

export const getPublicNews = cache(async (): Promise<PublicNews[]> => {
  const now = new Date().toISOString();
  const { data, error } = await createPublicClient().from("news").select(newsSelection)
    .eq("status", "published").lte("published_at", now)
    .order("published_at", { ascending: false }).limit(24);
  if (error) { console.error("public_news_failed", error.code); return []; }
  return (data ?? []) as unknown as PublicNews[];
});

export const getPublicNewsBySlug = cache(async (slug: string): Promise<PublicNews | null> => {
  const { data, error } = await createPublicClient().from("news").select(newsSelection)
    .eq("slug", slug).eq("status", "published")
    .lte("published_at", new Date().toISOString()).maybeSingle();
  if (error) { console.error("public_news_detail_failed", error.code); return null; }
  return (data as unknown as PublicNews | null) ?? null;
});

export const getPublicAnnouncements = cache(async (): Promise<PublicAnnouncement[]> => {
  const now = new Date().toISOString();
  const { data, error } = await createPublicClient().from("announcements")
    .select(announcementSelection).eq("status", "published").lte("published_at", now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("published_at", { ascending: false }).limit(24);
  if (error) { console.error("public_announcements_failed", error.code); return []; }
  return (data ?? []) as PublicAnnouncement[];
});

export const getPublicAnnouncementBySlug = cache(async (slug: string): Promise<PublicAnnouncement | null> => {
  const now = new Date().toISOString();
  const { data, error } = await createPublicClient().from("announcements")
    .select(announcementSelection).eq("slug", slug).eq("status", "published")
    .lte("published_at", now).or(`expires_at.is.null,expires_at.gt.${now}`).maybeSingle();
  if (error) { console.error("public_announcement_detail_failed", error.code); return null; }
  return (data as PublicAnnouncement | null) ?? null;
});
