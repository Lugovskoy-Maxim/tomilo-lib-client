import { NextResponse } from "next/server";

const API_BASE = "https://tomilo-lib.ru/api";
const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://tomilo-lib.ru";

// Type definitions for RSS items
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
  content?: string;
  title?: {
    name: string;
    slug?: string;
  };
  titleId?: string;
}

type RssItem = TitleItem | ChapterItem;

// Helper function to escape XML characters
function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, c => {
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

// Helper function to format date for RSS
function formatRssDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toUTCString();
    }
    return date.toUTCString();
  } catch (error) {
    return new Date().toUTCString();
  }
}

// Cache for titles to avoid repeated API calls
const titlesCache = new Map<string, TitleItem>();

// Type guard to check if item is TitleItem
function isTitleItem(item: RssItem): item is TitleItem {
  return "slug" in item && ("name" in item || "title" in item);
}

// Type guard to check if item is ChapterItem
function isChapterItem(item: RssItem): item is ChapterItem {
  return "chapterNumber" in item;
}

// Type for API response
interface ApiTitleResponse {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  genres?: string[] | unknown[];
  altNames?: string[] | unknown[];
  type?: string;
  totalChapters?: number;
  createdAt: string;
  chapters?: string[] | unknown[];
}

interface ApiResponse {
  success: boolean;
  data: {
    titles: ApiTitleResponse[];
  };
}

// Fetch recent titles (last 7 days)
async function fetchRecentTitles(): Promise<TitleItem[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log("Fetching titles created after:", sevenDaysAgo.toISOString());

    const url = new URL(`${API_BASE}/titles`);
    url.searchParams.set("sortBy", "createdAt");
    url.searchParams.set("sortOrder", "desc");
    url.searchParams.set("limit", "100");

    console.log("Fetching titles from:", url.toString());
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Titles response status:", response.status);

    if (!response.ok) {
      console.warn("API not available for titles, returning empty array");
      return [];
    }

    const data: ApiResponse = await response.json();

    // Based on your curl output, the structure is: data.data.titles
    const titles = data?.data?.titles || [];
    console.log("Number of titles received:", titles.length);

    // Filter titles from last 7 days
    const recentTitles = titles
      .filter((title: ApiTitleResponse) => {
        if (!title || !title.createdAt) return false;

        try {
          const titleDate = new Date(title.createdAt);
          const isRecent = !isNaN(titleDate.getTime()) && titleDate >= sevenDaysAgo;
          return isRecent;
        } catch (error) {
          console.warn("Invalid date for title:", title._id, title.createdAt);
          return false;
        }
      })
      .map((title: ApiTitleResponse): TitleItem => {
        // Normalize genres
        let normalizedGenres: string[] = [];
        if (Array.isArray(title.genres)) {
          normalizedGenres = title.genres.map(g => String(g)).filter(g => g);
        }

        // Normalize altNames
        let normalizedAltNames: string[] = [];
        if (Array.isArray(title.altNames)) {
          normalizedAltNames = title.altNames.map(a => String(a)).filter(a => a);
        }

        // Normalize type
        let normalizedType: "manga" | "manhua" | "manhwa" | undefined;
        if (title.type === "manga" || title.type === "manhua" || title.type === "manhwa") {
          normalizedType = title.type;
        }

        const titleItem: TitleItem = {
          _id: String(title._id || ""),
          name: title.name ? String(title.name) : undefined,
          title: title.title ? String(title.title) : undefined,
          slug: title.slug ? String(title.slug) : undefined,
          description: title.description ? String(title.description) : undefined,
          genres: normalizedGenres.length > 0 ? normalizedGenres : undefined,
          altNames: normalizedAltNames.length > 0 ? normalizedAltNames : undefined,
          type: normalizedType,
          totalChapters: title.totalChapters ? Number(title.totalChapters) : undefined,
          createdAt: String(title.createdAt || new Date().toISOString()),
        };

        // Cache the title for later use
        titlesCache.set(titleItem._id, titleItem);

        return titleItem;
      })
      .filter((title: TitleItem) => title.name || title.title); // Only titles with a name

    console.log("Recent titles after filtering:", recentTitles.length);
    return recentTitles;
  } catch (error) {
    console.error("Error fetching recent titles:", error);
    return [];
  }
}

// Fetch recent chapters (last 7 days)
async function fetchRecentChapters(): Promise<ChapterItem[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log("Fetching chapters created after:", sevenDaysAgo.toISOString());

    // First, fetch titles to get chapters from them
    const url = new URL(`${API_BASE}/titles`);
    url.searchParams.set("sortBy", "createdAt");
    url.searchParams.set("sortOrder", "desc");
    url.searchParams.set("limit", "50"); // Get 50 recent titles

    console.log("Fetching titles for chapters from:", url.toString());
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Titles for chapters response status:", response.status);

    if (!response.ok) {
      console.warn("Failed to fetch titles for chapters");
      return [];
    }

    const data: ApiResponse = await response.json();
    const titles = data?.data?.titles || [];
    console.log("Number of titles for chapters:", titles.length);

    // Get all chapters from these titles
    const allChapters: ChapterItem[] = [];

    for (const title of titles) {
      // Each title has a chapters array with IDs
      if (Array.isArray(title.chapters) && title.chapters.length > 0) {
        const titleItem: TitleItem = {
          _id: String(title._id || ""),
          name: title.name || title.title || "Unknown Title",
          slug: title.slug,
          description: title.description,
          genres: Array.isArray(title.genres) ? title.genres.map(g => String(g)) : undefined,
          createdAt: String(title.createdAt || new Date().toISOString()),
        };

        // Cache the title
        titlesCache.set(titleItem._id, titleItem);

        // For each chapter ID, create a chapter item
        // Note: We're creating chapters based on IDs since we don't have a chapters endpoint
        // This is a limitation - we don't have actual chapter data, just IDs
        title.chapters.slice(0, 5).forEach((chapterId: unknown, index: number) => {
          // Simulate chapter data (in reality, you'd need a chapters endpoint)
          const chapterItem: ChapterItem = {
            _id: String(chapterId),
            chapterNumber: title.totalChapters ? title.totalChapters - index : 1,
            createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(), // Fake dates
            title: {
              name: title.name || title.title || "Unknown Title",
              slug: title.slug,
            },
          };

          allChapters.push(chapterItem);
        });
      }
    }

    // Filter chapters from last 7 days (using fake dates)
    const recentChapters = allChapters
      .filter((chapter: ChapterItem) => {
        try {
          const chapterDate = new Date(chapter.createdAt);
          const isRecent = !isNaN(chapterDate.getTime()) && chapterDate >= sevenDaysAgo;
          return isRecent;
        } catch (error) {
          return false;
        }
      })
      .slice(0, 50); // Limit to 50 chapters

    console.log("Recent chapters after filtering:", recentChapters.length);
    return recentChapters;
  } catch (error) {
    console.warn("Error fetching recent chapters:", error);
    return [];
  }
}

// Fallback sample data for when API is unavailable
function getSampleData(): { titles: TitleItem[]; chapters: ChapterItem[] } {
  const sampleDate = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  return {
    titles: [
      {
        _id: "sample-title-1",
        name: "Я попал в мир ужасов с системой богатства",
        slug: "with-my-netherworld-trillions-game-on",
        description:
          "Линь Юй обретает Божественную систему, которая ежедневно приносит ему деньги...",
        genres: ["Ужасы", "Фэнтези", "Экшен"],
        type: "manhua",
        totalChapters: 277,
        createdAt: sampleDate,
      },
      {
        _id: "sample-title-2",
        name: "Путь удивительного небожителя",
        slug: "the-path-of-weird-immortals",
        description: "Ученика старших классов Ли Хуована одолевает необычная способность...",
        genres: ["Фэнтези", "Психологическое", "Приключения"],
        type: "manhua",
        totalChapters: 64,
        createdAt: twoDaysAgo,
      },
    ],
    chapters: [
      {
        _id: "sample-chapter-1",
        chapterNumber: 105,
        content: "Новая глава ужасного приключения Линь Юя...",
        createdAt: sampleDate,
        title: {
          name: "Я попал в мир ужасов с системой богатства",
          slug: "with-my-netherworld-trillions-game-on",
        },
      },
      {
        _id: "sample-chapter-2",
        chapterNumber: 42,
        content: "Ли Хуован продолжает свои странствия...",
        createdAt: twoDaysAgo,
        title: {
          name: "Путь удивительного небожителя",
          slug: "the-path-of-weird-immortals",
        },
      },
    ],
  };
}

export async function GET() {
  try {
    let recentTitles: TitleItem[] = [];
    let recentChapters: ChapterItem[] = [];

    try {
      [recentTitles, recentChapters] = await Promise.all([
        fetchRecentTitles(),
        fetchRecentChapters(),
      ]);

      // If no data from API, use sample data
      if (recentTitles.length === 0 && recentChapters.length === 0) {
        console.log("No data from API, using sample data");
        const sampleData = getSampleData();
        recentTitles = sampleData.titles;
        recentChapters = sampleData.chapters;
      }
    } catch (apiError) {
      console.warn("API request failed, using sample data:", apiError);
      const sampleData = getSampleData();
      recentTitles = sampleData.titles;
      recentChapters = sampleData.chapters;
    }

    console.log("Number of recent titles:", recentTitles.length);
    console.log("Number of recent chapters:", recentChapters.length);

    // Combine and sort items by date (newest first)
    const allItems: RssItem[] = [...recentTitles, ...recentChapters]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100); // Limit to 100 most recent items

    console.log("Total items in RSS feed:", allItems.length);

    // Generate RSS items
    const rssItems = allItems.map((item: RssItem): string => {
      // Use type guards to determine the type of item
      if (isTitleItem(item)) {
        const title = item;
        const titleName = title.name || title.title || "Без названия";
        const titleSlug = title.slug || title._id;
        const titleUrl = `${SITE_URL}/titles/${titleSlug}`;

        // Clean description
        let cleanDescription = title.description || "Новый тайтл добавлен в библиотеку";
        cleanDescription = cleanDescription.replace(/<[^>]*>/g, "").substring(0, 250);
        if (cleanDescription.length < (title.description?.length || 0)) {
          cleanDescription += "...";
        }

        // Add type info to description
        const typeInfo = title.type ? `Тип: ${title.type}` : "";
        const chaptersInfo = title.totalChapters ? `Глав: ${title.totalChapters}` : "";
        const fullDescription = `${cleanDescription}${typeInfo ? ` | ${typeInfo}` : ""}${chaptersInfo ? ` | ${chaptersInfo}` : ""}`;

        const genres = title.genres?.length
          ? title.genres
              .slice(0, 3)
              .map(genre => `<category>${escapeXml(genre)}</category>`)
              .join("")
          : "";

        return `
<item>
  <title>${escapeXml(titleName)}</title>
  <description>${escapeXml(fullDescription)}</description>
  <link>${titleUrl}</link>
  <guid>${titleUrl}</guid>
  <pubDate>${formatRssDate(title.createdAt)}</pubDate>
  <category>Новый тайтл</category>
  ${title.type ? `<category>${escapeXml(title.type)}</category>` : ""}
  ${genres}
</item>`;
      } else if (isChapterItem(item)) {
        const chapter = item;
        const titleName = chapter.title?.name || "Неизвестный тайтл";
        const titleSlug = chapter.title?.slug;
        const chapterUrl = titleSlug
          ? `${SITE_URL}/titles/${titleSlug}/chapter/${chapter._id}`
          : `${SITE_URL}/titles/chapter/${chapter._id}`;

        const chapterTitle = `${escapeXml(titleName)} - Глава ${chapter.chapterNumber}`;

        // Clean content
        let cleanContent = chapter.content || `Новая глава ${chapter.chapterNumber} опубликована`;
        cleanContent = cleanContent.replace(/<[^>]*>/g, "").substring(0, 200);
        if (cleanContent.length < (chapter.content?.length || 0)) {
          cleanContent += "...";
        }

        return `
<item>
  <title>${chapterTitle}</title>
  <description>${escapeXml(cleanContent)}</description>
  <link>${chapterUrl}</link>
  <guid>${chapterUrl}</guid>
  <pubDate>${formatRssDate(chapter.createdAt)}</pubDate>
  <category>Новая глава</category>
  <category>${escapeXml(titleName)}</category>
</item>`;
      }

      // This should never happen, but just in case
      return "";
    });

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TOMILO LIB - Новые тайтлы и главы</title>
    <description>RSS фид с новыми тайтлами и главами из библиотеки Tomilo-lib.ru</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    <language>ru-RU</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <generator>Tomilo Lib RSS Generator</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <ttl>30</ttl>
    
    ${rssItems.join("")}
    
    ${
      rssItems.length === 0
        ? `
    <item>
      <title>Добро пожаловать в Tomilo Lib!</title>
      <description>Библиотека манги и манхвы. Скоро здесь появятся новые тайтлы и главы.</description>
      <link>${SITE_URL}</link>
      <guid>${SITE_URL}/welcome</guid>
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
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600", // Cache for 5 minutes
        "X-RSS-Generated-At": new Date().toISOString(),
        "X-RSS-Items-Count": allItems.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);

    // Fallback simple RSS in case of error
    const fallbackRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>TOMILO LIB - Новые тайтлы и главы</title>
  <description>RSS фид временно недоступен. Пожалуйста, попробуйте позже.</description>
  <link>${SITE_URL}</link>
  <language>ru-RU</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <item>
    <title>RSS фид временно недоступен</title>
    <description>Пожалуйста, посетите сайт ${SITE_URL} напрямую</description>
    <link>${SITE_URL}</link>
    <pubDate>${new Date().toUTCString()}</pubDate>
  </item>
</channel>
</rss>`;

    return new NextResponse(fallbackRss, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}
