import { getTitleById, getChapterByNumber, getChaptersByTitleId } from '@/constants/mokeReadPage';
import { ReadChapterPage } from '@/shared';

interface PageProps {
  params: {
    titleId: string;
    chapterNumber: string;
  };
}

export default function ChapterPage({ params }: PageProps) {
  const titleId = parseInt(params.titleId);
  const chapterNumber = parseInt(params.chapterNumber);

  const title = getTitleById(titleId);
  const chapter = getChapterByNumber(titleId, chapterNumber);
  const chapters = getChaptersByTitleId(titleId);

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