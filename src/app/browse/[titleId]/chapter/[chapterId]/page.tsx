'use client';

import { ReadChapterPage } from '@/widgets';
import { useParams } from 'next/navigation';
import { ReaderTitle as ReadTitle, ReaderChapter as ReadChapter } from '@/shared/reader/types';
import { useGetTitleByIdQuery } from '@/store/api/titlesApi';
import { useGetChaptersByTitleQuery } from '@/store/api/chaptersApi';
import { Chapter } from '@/types/title';

function getApiOrigin(): string {
  const env = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const u = new URL(env);
    return u.pathname.endsWith('/api') ? `${u.origin}` : `${u.origin}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return 'http://localhost:3001';
  }
}

function normalizeAssetUrl(p: string): string {
  if (!p) return '';
  if (p.startsWith('http')) {
    // If it's a full URL, replace /api/browse/ with /uploads/browse/
    return p.replace('/api/browse/', '/uploads/browse/');
  }
  let path = p.startsWith('/') ? p : `/${p}`;
  if (path.includes('/api/browse/')) {
    path = path.replace('/api/browse/', '/uploads/browse/');
  }
  const origin = getApiOrigin();
  return `${origin}${path}`;
}

export default function ChapterPage() {
  const params = useParams();
  const titleId = params.titleId as string;
  const chapterId = params.chapterId as string;

  // Load title and chapters using RTK Query
  const { data: titleData, isLoading: titleLoading, error: titleError } = useGetTitleByIdQuery(titleId);
  const { data: chaptersData, isLoading: chaptersLoading, error: chaptersError } = useGetChaptersByTitleQuery({ titleId, sortOrder: "asc" });

  const isLoading = titleLoading || chaptersLoading;
  const error = titleError || chaptersError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка данных...</div>
        </div>
      </div>
    );
  }

  if (error || !titleData?.data || !chaptersData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Глава не найдена</h1>
          <p className="text-[var(--muted-foreground)]">Не удалось загрузить данные.</p>
          <div className="mt-4 text-sm">
            <p>Title ID: {titleId}</p>
            <p>Chapter ID: {chapterId}</p>
          </div>
        </div>
      </div>
    );
  }

  const serverTitle = titleData.data;

  const mappedChapters: ReadChapter[] = chaptersData.map((ch: Chapter) => ({
    _id: ch._id,
    number: Number(ch.chapterNumber) || 0,
    title: ch.title || '',
    date: ch.releaseDate || '',
    views: Number(ch.views) || 0,
    images: Array.isArray(ch.pages) ? ch.pages.map((p: string) => normalizeAssetUrl(p)) : [],
  }));

  const mappedTitle: ReadTitle = {
    _id: serverTitle._id,
    title: serverTitle.name,
    originalTitle: serverTitle.altNames?.[0],
    type: serverTitle.type || 'Манга',
    year: Number(serverTitle.releaseYear) || new Date().getFullYear(),
    rating: Number(serverTitle.rating) || 0,
    image: normalizeAssetUrl(serverTitle.coverImage || ''),
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

  // Find chapter by _id
  const chapter = mappedChapters.find((c) => c._id === chapterId);

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Глава не найдена
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Запрошенная глава не существует или была удалена.
          </p>
          <div className="mt-4 text-sm">
            <p>Title ID: {titleId}</p>
            <p>Chapter ID: {chapterId}</p>
            <p>Available chapters: {mappedChapters.length}</p>
            <p>Available chapter IDs: {mappedChapters.map(c => c._id).join(', ')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReadChapterPage
      title={mappedTitle}
      chapter={chapter}
      chapters={mappedChapters}
    />
  );
}
