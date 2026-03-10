import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const SITEMAP_MAX_PAGES = 500;

async function fetchAllTitles(): Promise<{ slug?: string; updatedAt?: string; _id?: string }[]> {
  const all: { slug?: string; updatedAt?: string; _id?: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= SITEMAP_MAX_PAGES) {
    try {
      const res = await fetch(
        `${API_URL}/titles?page=${page}&limit=100&sortBy=updatedAt&sortOrder=desc`,
        {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        },
      );
      if (!res.ok) break;

      const json = await res.json();
      const data = json?.data ?? json;
      const list = data?.data ?? data?.titles ?? [];
      const totalPages = data?.totalPages ?? data?.pagination?.pages ?? 1;

      list.forEach((t: { slug?: string; updatedAt?: string; _id?: string }) => {
        if (t?.slug || t?._id) all.push({ slug: t.slug, updatedAt: t.updatedAt, _id: t._id });
      });

      if (page >= totalPages) hasMore = false;
      else page++;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sitemap: error fetching titles", e);
      }
      break;
    }
  }

  return all;
}

async function fetchAllCollections(): Promise<{ id?: string; _id?: string; updatedAt?: string }[]> {
  const all: { id?: string; _id?: string; updatedAt?: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= SITEMAP_MAX_PAGES) {
    try {
      const res = await fetch(
        `${API_URL}/collections?page=${page}&limit=100&sortBy=updatedAt&sortOrder=desc`,
        {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        },
      );
      if (!res.ok) break;

      const json = await res.json();
      const data = json?.data ?? json;
      const list = data?.collections ?? data?.data ?? [];
      const totalPages = data?.totalPages ?? data?.pagination?.pages ?? 1;

      list.forEach((c: { id?: string; _id?: string; updatedAt?: string }) => {
        const id = c?.id ?? c?._id;
        if (id) all.push({ id, updatedAt: c.updatedAt, _id: c._id });
      });

      if (page >= totalPages) hasMore = false;
      else page++;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sitemap: error fetching collections", e);
      }
      break;
    }
  }

  return all;
}

async function fetchAllAnnouncements(): Promise<
  { slug?: string; updatedAt?: string; publishedAt?: string }[]
> {
  const all: { slug?: string; updatedAt?: string; publishedAt?: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= SITEMAP_MAX_PAGES) {
    try {
      const res = await fetch(
        `${API_URL}/announcements?page=${page}&limit=100&sortBy=publishedAt&sortOrder=desc`,
        {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        },
      );
      if (!res.ok) break;

      const json = await res.json();
      const data = json?.data ?? json;
      const list = data?.announcements ?? data?.data ?? [];
      const totalPages = data?.totalPages ?? data?.pagination?.pages ?? 1;

      list.forEach((a: { slug?: string; updatedAt?: string; publishedAt?: string }) => {
        if (a?.slug) all.push({ slug: a.slug, updatedAt: a.updatedAt, publishedAt: a.publishedAt });
      });

      if (page >= totalPages) hasMore = false;
      else page++;
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sitemap: error fetching announcements", e);
      }
      break;
    }
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE_URL}/titles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    { url: `${BASE_URL}/top`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    {
      url: `${BASE_URL}/updates`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/leaders`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.85,
    },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${BASE_URL}/dmca`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${BASE_URL}/terms-of-use`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const [titles, collections, announcements] = await Promise.all([
      fetchAllTitles(),
      fetchAllCollections(),
      fetchAllAnnouncements(),
    ]);

    const titleEntries: MetadataRoute.Sitemap = titles
      .filter(t => t.slug)
      .map(t => ({
        url: `${BASE_URL}/titles/${encodeURIComponent(t.slug!)}`,
        lastModified: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));

    const collectionEntries: MetadataRoute.Sitemap = collections
      .filter(c => c.id ?? c._id)
      .map(c => ({
        url: `${BASE_URL}/collections/${c.id ?? c._id}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    const newsEntries: MetadataRoute.Sitemap = announcements
      .filter(a => a.slug)
      .map(a => ({
        url: `${BASE_URL}/news/${encodeURIComponent(a.slug!)}`,
        lastModified: a.updatedAt
          ? new Date(a.updatedAt)
          : a.publishedAt
            ? new Date(a.publishedAt)
            : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [...staticRoutes, ...titleEntries, ...collectionEntries, ...newsEntries];
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("Sitemap generation error:", e);
    }
    return staticRoutes;
  }
}
