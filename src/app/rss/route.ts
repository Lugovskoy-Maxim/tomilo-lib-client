import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://tomilo-lib.ru/api";
const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

interface BaseItem {
  createdAt: string;
  _id: string;
}

interface TitleItem extends BaseItem {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  genres?: string[];
  altNames?: string[];
  type?: "manga" | "manhua" | "manhwa";
  totalChapters?: number;
}

interface ChapterItem extends BaseItem {
  chapterNumber: number;
  title?: string;
  content?: string;
  titleId?: string;
  releaseDate?: string;
}

interface ApiChapter {
  _id: string;
  chapterNumber: number;
  title?: string;
  createdAt?: string;
  releaseDate?: string;
  titleId?: string | { name?: string; slug?: string; _id?: string };
}

type RssItem = (TitleItem & { itemType: "title" }) | (ChapterItem & { itemType: "chapter"; titleName?: string; titleSlug?: string });

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function formatRssDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

async function fetchRecentTitles(): Promise<TitleItem[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const url = new URL(`${API_BASE}/titles`);
    url.searchParams.set("sortBy", "createdAt");
    url.searchParams.set("sortOrder", "desc");
    url.searchParams.set("limit", "100");

    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return [];

    const data = await res.json();
    const titles = data?.data?.titles ?? data?.data ?? data?.titles ?? [];

    return titles
      .filter((t: { createdAt?: string; name?: string; title?: string }) => {
        if (!t?.createdAt) return false;
        const d = new Date(t.createdAt);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      })
      .map((t: Record<string, unknown>) => ({
        _id: String(t._id ?? ""),
        name: t.name ? String(t.name) : undefined,
        title: t.title ? String(t.title) : undefined,
        slug: t.slug ? String(t.slug) : undefined,
        description: t.description ? String(t.description) : undefined,
        genres: Array.isArray(t.genres) ? t.genres.map(g => String(g)) : undefined,
        type: ["manga", "manhua", "manhwa"].includes(String(t.type || "")) ? (t.type as TitleItem["type"]) : undefined,
        totalChapters: t.totalChapters != null ? Number(t.totalChapters) : undefined,
        createdAt: String(t.createdAt ?? new Date().toISOString()),
      }))
      .filter((t: TitleItem) => t.name || t.title);
  } catch {
    return [];
  }
}

async function fetchRecentChapters(): Promise<(ChapterItem & { titleName?: string; titleSlug?: string })[]> {
  try {
    const url = new URL(`${API_BASE}/chapters`);
    url.searchParams.set("limit", "80");
    url.searchParams.set("sortBy", "createdAt");
    url.searchParams.set("sortOrder", "desc");

    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (!res.ok) return [];

    const data = await res.json();
    const raw = data?.data?.chapters ?? data?.chapters ?? data?.data ?? [];
    const list = Array.isArray(raw) ? raw : [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return list
      .filter((c: ApiChapter) => c?._id && c?.createdAt && new Date(c.createdAt) >= sevenDaysAgo)
      .slice(0, 60)
      .map((c: ApiChapter) => {
        const titleRef = c.titleId;
        const titleName =
          typeof titleRef === "object" && titleRef?.name
            ? String(titleRef.name)
            : undefined;
        const titleSlug =
          typeof titleRef === "object" && titleRef?.slug
            ? String(titleRef.slug)
            : undefined;

        return {
          _id: String(c._id),
          chapterNumber: Number(c.chapterNumber) || 0,
          title: typeof c.title === "string" ? c.title : undefined,
          createdAt: String(c.createdAt ?? new Date().toISOString()),
          releaseDate: c.releaseDate,
          titleId: typeof c.titleId === "string" ? c.titleId : undefined,
          titleName: titleName || "Тайтл",
          titleSlug: titleSlug || undefined,
        };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const [recentTitles, recentChapters] = await Promise.all([
      fetchRecentTitles(),
      fetchRecentChapters(),
    ]);

    const titleRssItems: RssItem[] = recentTitles.map(t => ({
      ...t,
      itemType: "title" as const,
    }));

    const chapterRssItems: RssItem[] = recentChapters.map(c => ({
      _id: c._id,
      chapterNumber: c.chapterNumber,
      title: c.title,
      createdAt: c.createdAt,
      itemType: "chapter" as const,
      titleName: c.titleName,
      titleSlug: c.titleSlug,
    }));

    const allItems: RssItem[] = [...titleRssItems, ...chapterRssItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);

    const rssItems = allItems.map((item): string => {
      if (item.itemType === "title") {
        const t = item;
        const name = t.name || t.title || "Без названия";
        const slug = t.slug || t._id;
        const link = `${SITE_URL}/titles/${slug}`;
        let desc = (t.description || "Новый тайтл в библиотеке Tomilo-lib.ru").replace(/<[^>]*>/g, "").substring(0, 250);
        if (desc.length < (t.description?.length ?? 0)) desc += "...";
        if (t.type) desc += ` | Тип: ${t.type}`;
        if (t.totalChapters != null) desc += ` | Глав: ${t.totalChapters}`;

        const genres =
          t.genres?.length ?
            t.genres.slice(0, 3).map(g => `<category>${escapeXml(g)}</category>`).join("") : "";

        return `
<item>
  <title>${escapeXml(name)}</title>
  <description>${escapeXml(desc)}</description>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <pubDate>${formatRssDate(t.createdAt)}</pubDate>
  <category>Новый тайтл</category>
  ${t.type ? `<category>${escapeXml(t.type)}</category>` : ""}
  ${genres}
</item>`;
      }

      const c = item;
      const titleName = c.titleName || "Тайтл";
      const titleSlug = c.titleSlug;
      const chapterUrl = titleSlug
        ? `${SITE_URL}/titles/${titleSlug}/chapter/${c._id}`
        : `${SITE_URL}/titles/chapter/${c._id}`;
      const itemTitle = `${escapeXml(titleName)} — Глава ${c.chapterNumber}${c.title ? ` «${escapeXml(c.title)}»` : ""}`;
      const itemDesc = c.title
        ? `Глава ${c.chapterNumber}: ${escapeXml(c.title)}`
        : `Новая глава ${c.chapterNumber} тайтла «${escapeXml(titleName)}»`;

      return `
<item>
  <title>${itemTitle}</title>
  <description>${escapeXml(itemDesc)}</description>
  <link>${escapeXml(chapterUrl)}</link>
  <guid isPermaLink="true">${escapeXml(chapterUrl)}</guid>
  <pubDate>${formatRssDate(c.createdAt)}</pubDate>
  <category>Новая глава</category>
  <category>${escapeXml(titleName)}</category>
</item>`;
    });

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tomilo-lib — Новые тайтлы и главы</title>
    <description>RSS: новые тайтлы и главы манги, манхвы и маньхуа на Tomilo-lib.ru. Читайте онлайн.</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    <atom:link href="${SITE_URL}/rss" rel="alternate" type="application/rss+xml"/>
    <language>ru-RU</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <generator>Tomilo-lib RSS</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>30</ttl>
    ${rssItems.join("")}
    ${
      rssItems.length === 0
        ? `
    <item>
      <title>Добро пожаловать на Tomilo-lib</title>
      <description>Библиотека манги, манхвы и маньхуа. Скоро здесь появятся новые тайтлы и главы.</description>
      <link>${SITE_URL}</link>
      <guid isPermaLink="true">${SITE_URL}/welcome</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <category>Информация</category>
    </item>`
        : ""
    }
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("RSS generation error:", error);
    }
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Tomilo-lib — Новые тайтлы и главы</title>
  <description>RSS временно недоступен. Посетите ${SITE_URL}</description>
  <link>${SITE_URL}</link>
  <language>ru-RU</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <item>
    <title>RSS временно недоступен</title>
    <description>Попробуйте позже: ${SITE_URL}</description>
    <link>${SITE_URL}</link>
    <pubDate>${new Date().toUTCString()}</pubDate>
  </item>
</channel>
</rss>`;

    return new NextResponse(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
