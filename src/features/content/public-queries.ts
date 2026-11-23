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

export type PublicGalleryImage = {
  id: string;
  image_path: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
};

export type PublicGallery = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_path: string | null;
  published_at: string;
  gallery_images: PublicGalleryImage[];
};

const gallerySelection =
  "id, title, slug, description, cover_path, published_at, gallery_images(id, image_path, alt_text, caption, sort_order)";

function sortImages(gallery: PublicGallery): PublicGallery {
  return {
    ...gallery,
    gallery_images: [...(gallery.gallery_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  };
}

export const getPublicGalleries = cache(async (): Promise<PublicGallery[]> => {
  const { data, error } = await createPublicClient()
    .from("galleries")
    .select(gallerySelection)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("sort_order")
    .order("published_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("public_galleries_failed", error.code);
    return [];
  }

  return ((data ?? []) as unknown as PublicGallery[]).map(sortImages);
});

export const getPublicGalleryBySlug = cache(
  async (slug: string): Promise<PublicGallery | null> => {
    const { data, error } = await createPublicClient()
      .from("galleries")
      .select(gallerySelection)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("public_gallery_detail_failed", error.code);
      return null;
    }

    return data ? sortImages(data as unknown as PublicGallery) : null;
  },
);


export type PublicAchievement = {
  id: string;
  title: string;
  slug: string;
  description: string;
  recipient: string | null;
  achievement_level: "Sekolah" | "Kabupaten/Kota" | "Provinsi" | "Nasional" | "Internasional";
  achievement_date: string | null;
  image_path: string | null;
};

const achievementSelection =
  "id, title, slug, description, recipient, achievement_level, achievement_date, image_path";

export const getPublicAchievements = cache(async (): Promise<PublicAchievement[]> => {
  const { data, error } = await createPublicClient()
    .from("achievements")
    .select(achievementSelection)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("sort_order")
    .order("achievement_date", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("public_achievements_failed", error.code);
    return [];
  }

  return (data ?? []) as PublicAchievement[];
});

export const getPublicAchievementBySlug = cache(
  async (slug: string): Promise<PublicAchievement | null> => {
    const { data, error } = await createPublicClient()
      .from("achievements")
      .select(achievementSelection)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error("public_achievement_detail_failed", error.code);
      return null;
    }

    return (data as PublicAchievement | null) ?? null;
  },
);
