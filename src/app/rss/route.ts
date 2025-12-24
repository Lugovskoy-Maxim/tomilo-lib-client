import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const SITE_URL = process.env.NEXT_PUBLIC_URL || 'https://tomilo-lib.ru';

// Type definitions for RSS items
interface BaseItem {
  createdAt: string;
}

interface TitleItem extends BaseItem {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  genres?: string[];
}

interface ChapterItem extends BaseItem {
  _id: string;
  chapterNumber: number;
  content?: string;
  titleInfo?: {
    name: string;
    slug?: string;
  };
}

type RssItem = TitleItem | ChapterItem;

// Helper function to escape XML characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return "&apos;";
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Helper function to format date for RSS
function formatRssDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toUTCString();
}

// Fetch recent titles (last 7 days)
async function fetchRecentTitles(): Promise<TitleItem[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log('Seven days ago:', sevenDaysAgo.toISOString());

    const url = new URL('/titles', API_BASE);
    url.searchParams.set('sortBy', 'createdAt');
    url.searchParams.set('sortOrder', 'desc');
    url.searchParams.set('limit', '100');
    url.searchParams.set('populate', 'true');

    console.log('Fetching titles from:', url.toString());
    const response = await fetch(url.toString(), { cache: 'no-store' });
    console.log('Titles response status:', response.status);
    
    if (!response.ok) {
      console.warn('API not available for titles, returning empty array');
      return [];
    }

    const data = await response.json();
    console.log('Titles data received:', JSON.stringify(data, null, 2));
    const titles = data?.data?.titles || data?.data?.data || [];
    console.log('Number of titles before filtering:', titles.length);

    // Filter titles from last 7 days
    const recentTitles = titles
      .filter((title: Record<string, unknown>) => {
        const titleDate = new Date(title.createdAt as string);
        const isRecent = title.createdAt && typeof title.createdAt === 'string' && titleDate >= sevenDaysAgo;
        console.log(`Title ${title._id} date: ${title.createdAt}, isRecent: ${isRecent}`);
        return isRecent;
      })
      .map((title: Record<string, unknown>) => ({
        _id: String(title._id || ''),
        name: title.name ? String(title.name) : undefined,
        title: title.title ? String(title.title) : undefined,
        slug: title.slug ? String(title.slug) : undefined,
        description: title.description ? String(title.description) : undefined,
        genres: Array.isArray(title.genres) ? title.genres.map(String) : undefined,
        createdAt: String(title.createdAt || ''),
      }));
      
    console.log('Number of recent titles after filtering:', recentTitles.length);
    return recentTitles;
  } catch (error) {
    console.error('Error fetching recent titles:', error);
    return [];
  }
}

// Fetch recent chapters (last 7 days)
async function fetchRecentChapters(): Promise<ChapterItem[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    console.log('Seven days ago for chapters:', sevenDaysAgo.toISOString());

    const url = new URL('/chapters', API_BASE);
    url.searchParams.set('sortBy', 'createdAt');
    url.searchParams.set('sortOrder', 'desc');
    url.searchParams.set('limit', '200');
    url.searchParams.set('populate', 'true');

    console.log('Fetching chapters from:', url.toString());
    const response = await fetch(url.toString(), { cache: 'no-store' });
    console.log('Chapters response status:', response.status);
    
    if (!response.ok) {
      console.warn('API not available for chapters, returning empty array');
      return [];
    }

    const data = await response.json();
    console.log('Chapters data received:', JSON.stringify(data, null, 2));
    const chapters = data?.data?.chapters || data?.data?.data || [];
    console.log('Number of chapters before filtering:', chapters.length);

    // Filter chapters from last 7 days and get title info
    const recentChapters = chapters.filter((chapter: Record<string, unknown>) => {
      const chapterDate = new Date(chapter.createdAt as string);
      const isRecent = chapter.createdAt && typeof chapter.createdAt === 'string' && chapterDate >= sevenDaysAgo;
      console.log(`Chapter ${chapter._id} date: ${chapter.createdAt}, isRecent: ${isRecent}`);
      return isRecent;
    });

    console.log('Number of recent chapters after filtering:', recentChapters.length);

    // Fetch title info for each chapter
    const chaptersWithTitles: ChapterItem[] = await Promise.all(
      recentChapters.map(async (chapter: Record<string, unknown>) => {
        let titleInfo: { name: string; slug?: string } | undefined;

        try {
          const titleResponse = await fetch(`${API_BASE}/titles/${chapter.titleId}`, { cache: 'no-store' });
          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            const title = titleData?.data || titleData;
            titleInfo = {
              name: title?.name || title?.title || 'Unknown Title',
              slug: title?.slug
            };
          }
        } catch (error) {
          console.warn(`Error fetching title for chapter ${chapter._id}, using default title info`);
        }

        return {
          _id: String(chapter._id || ''),
          chapterNumber: Number(chapter.chapterNumber || 0),
          content: chapter.content ? String(chapter.content) : undefined,
          createdAt: String(chapter.createdAt || ''),
          titleInfo
        };
      })
    );

    console.log('Number of chapters with titles:', chaptersWithTitles.length);
    return chaptersWithTitles;
  } catch (error) {
    console.warn('Error fetching recent chapters, returning empty array:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Try to fetch recent titles and chapters from API
    let recentTitles: TitleItem[] = [];
    let recentChapters: ChapterItem[] = [];

    try {
      [recentTitles, recentChapters] = await Promise.all([
        fetchRecentTitles(),
        fetchRecentChapters()
      ]);
    } catch (apiError) {
      console.warn('API not available, using sample data for RSS feed:', apiError);
      // Provide sample data when API is not available
      recentTitles = [
        {
          _id: 'sample-title-1',
          name: 'Пример тайтла',
          slug: 'primer-tajjla',
          description: 'Это пример тайтла для демонстрации RSS фида',
          genres: ['фэнтези', 'приключения'],
          createdAt: new Date().toISOString()
        }
      ];
      recentChapters = [
        {
          _id: 'sample-chapter-1',
          chapterNumber: 1,
          content: 'Это пример главы для демонстрации RSS фида',
          createdAt: new Date().toISOString(),
          titleInfo: {
            name: 'Пример тайтла',
            slug: 'primer-tajjla'
          }
        }
      ];
    }

    console.log('Number of recent titles:', recentTitles.length);
    console.log('Number of recent chapters:', recentChapters.length);
    
    // Sort items by date (newest first) and limit to 100 most recent items
    const allItems: RssItem[] = [...recentTitles, ...recentChapters]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);
      
    console.log('Total items after sorting:', allItems.length);

    const sortedRssItems = allItems.map((item: RssItem) => {
      const isTitle = 'name' in item || 'title' in item;
      if (isTitle) {
        const title = item as TitleItem;
        const titleUrl = `${SITE_URL}/titles/${title.slug}`;
        const description = title.description
          ? escapeXml(title.description.substring(0, 200) + (title.description.length > 200 ? '...' : ''))
          : 'Новый тайтл добавлен в библиотеку';

        return `
<item>
  <title>${escapeXml(title.name || title.title || 'Без названия')}</title>
  <description>${description}</description>
  <link>${titleUrl}</link>
  <guid>${titleUrl}</guid>
  <pubDate>${formatRssDate(title.createdAt)}</pubDate>
  <category>title</category>
  ${title.genres?.map((genre: string) => `<category>${escapeXml(genre)}</category>`).join('') || ''}
</item>`;
      } else {
        const chapter = item as ChapterItem;
        const titleSlug = chapter.titleInfo?.slug;
        const chapterUrl = titleSlug
          ? `${SITE_URL}/titles/${titleSlug}/chapter/${chapter._id}`
          : `${SITE_URL}/titles/chapter/${chapter._id}`;

        const chapterTitle = chapter.titleInfo?.name
          ? `${chapter.titleInfo.name} - Глава ${chapter.chapterNumber}`
          : `Глава ${chapter.chapterNumber}`;

        const description = chapter.content
          ? escapeXml(chapter.content.substring(0, 200) + (chapter.content.length > 200 ? '...' : ''))
          : `Новая глава ${chapter.chapterNumber} опубликована`;

        return `
<item>
  <title>${escapeXml(chapterTitle)}</title>
  <description>${description}</description>
  <link>${chapterUrl}</link>
  <guid>${chapterUrl}</guid>
  <pubDate>${formatRssDate(chapter.createdAt)}</pubDate>
  <category>chapter</category>
</item>`;
      }
    });

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TOMILO LIB - Новые тайтлы и главы</title>
    <description>RSS фид с новыми тайтлами и главами из библиотеки Tomilo-lib.ru</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss" rel="self" type="application/rss+xml"/>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Tomilo Library RSS Generator</generator>
    ${sortedRssItems.join('')}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      },
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}