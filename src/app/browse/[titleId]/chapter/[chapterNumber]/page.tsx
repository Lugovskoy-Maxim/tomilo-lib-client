import { ReadChapterPage } from '@/widgets';
import * as React from 'react'
import { ReaderTitle as ReadTitle, ReaderChapter as ReadChapter } from '@/shared/reader/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function toNumericId(id: string): number {
  // simple stable numeric surrogate id from hex string
  try {
    const chunk = id.slice(-7);
    return parseInt(chunk, 16) || 0;
  } catch {
    return 0;
  }
}

interface PageProps {
  params: {
    titleId: string;
    chapterNumber: string;
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { titleId, chapterNumber } = await params;

  // Load title with embedded chapters from API
  const res = await fetch(`${API_BASE}/titles/${titleId}`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Глава не найдена</h1>
          <p className="text-[var(--muted-foreground)]">Не удалось загрузить тайтл.</p>
        </div>
      </div>
    );
  }

  const serverTitle = await res.json();
  const base = process.env.NEXT_PUBLIC_URL || '';

  const mappedChapters: ReadChapter[] = (serverTitle.chapters || []).map((ch: any) => ({
    id: typeof ch.chapterNumber === 'number' ? ch.chapterNumber : toNumericId(ch._id || `${ch.chapterNumber}`),
    number: Number(ch.chapterNumber) || 0,
    title: ch.title || ch.name || '',
    date: ch.releaseDate || '',
    views: Number(ch.views) || 0,
    images: (ch.pages || []).map((p: string) => `${base}${p}`),
  }));

  const mappedTitle: ReadTitle = {
    id: (serverTitle._id || titleId),
    title: serverTitle.name,
    originalTitle: serverTitle.altNames?.[0],
    type: serverTitle.type || 'Манга',
    year: Number(serverTitle.releaseYear) || new Date().getFullYear(),
    rating: Number(serverTitle.rating) || 0,
    image: `${base}${serverTitle.coverImage || ''}`,
    genres: serverTitle.genres || [],
    description: serverTitle.description || '',
    status: serverTitle.status || 'ongoing',
    author: serverTitle.author || '',
    artist: serverTitle.artist || '',
    totalChapters: Number(serverTitle.totalChapters) || mappedChapters.length,
    views: Number(serverTitle.views) || 0,
    lastUpdate: serverTitle.updatedAt || '',
    chapters: mappedChapters,
    alternativeTitles: serverTitle.altNames || [],
  };

  console.log(mappedTitle)
  // Select chapter by number or by id
  const chapterIdOrNum = chapterNumber;
  const numeric = Number(chapterIdOrNum);
  const isNumeric = !Number.isNaN(numeric) && `${numeric}` === chapterIdOrNum;
  const selected = isNumeric
    ? mappedChapters.find((c) => c.number === numeric)
    : mappedChapters.find((c, idx) => (serverTitle.chapters?.[idx]?._id || '') === chapterIdOrNum);

  const chapter = selected;
  const chapters = mappedChapters;

  if (!mappedTitle || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Глава не найдена
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Запрошенная глава не существует или была удалена.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ReadChapterPage
      title={mappedTitle}
      chapter={chapter}
      chapters={chapters}
    />
  );
}