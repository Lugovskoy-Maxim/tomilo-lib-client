import { getTitleById, getChapterByNumber, getChaptersByTitleId } from '@/constants/mokeReadPage';
import { ReadChapterPage } from '@/shared';
import * as React from 'react'

interface PageProps {
  params: {
    titleId: string;
    chapterNumber: string;
  };
}

export default async function ChapterPage({ params }: PageProps) {
  // Деструктурируем после await
  const { titleId, chapterNumber } = await params;
  const titleIdNum = parseInt(titleId);
  const chapterNumberNum = parseInt(chapterNumber);

  const title = getTitleById(titleIdNum);
  const chapter = getChapterByNumber(titleIdNum, chapterNumberNum);
  const chapters = getChaptersByTitleId(titleIdNum);

  if (!title || !chapter) {
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
      title={title} 
      chapter={chapter} 
      chapters={chapters} 
    />
  );
}