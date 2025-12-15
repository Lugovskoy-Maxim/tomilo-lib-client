import { Suspense } from "react";
import ServerChapterPage, { generateMetadata } from "./server-page";

// Экспортируем функцию генерации метаданных для Next.js
export { generateMetadata };

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ titleId: string; chapterId: string }>;
}) {
  const { titleId, chapterId } = await params;
          console.log("titleId:", titleId);
        console.log("chapterId:", chapterId);
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка данных...</div>
        </div>
      </div>
    }>
      <ServerChapterPage params={params} />
    </Suspense>
  );
}
