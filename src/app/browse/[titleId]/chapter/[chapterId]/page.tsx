import { Suspense } from "react";
import ServerChapterPage from "./server-page";

export default function ChapterPage({
  params,
}: {
  params: { titleId: string; chapterId: string };
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <div className="text-[var(--foreground)]">Загрузка данных...</div>
        </div>
      </div>
    }>
      <ServerChapterPage titleId={params.titleId} chapterId={params.chapterId} />
    </Suspense>
  );
}
