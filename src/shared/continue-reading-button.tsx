import Button from "@/shared/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ContinueReadingButtonProps {
  className?: string;
}

export function ContinueReadingButton({ className }: ContinueReadingButtonProps) {
  const { user, readingHistoryLoading } = useAuth();
  const router = useRouter();

  // Получаем последнюю прочитанную главу из истории чтения
  const getLastReadChapter = () => {
    if (!user?.readingHistory || user.readingHistory.length === 0) return null;

    // Собираем все главы со временем чтения
    const allChaptersWithTime = user.readingHistory.flatMap(historyItem => {
      return historyItem.chapters.map(chapter => ({
        titleId: typeof historyItem.titleId === 'string' ? historyItem.titleId : historyItem.titleId._id,
        chapterId: chapter.chapterId,
        chapterNumber: chapter.chapterNumber,
        readAt: new Date(chapter.readAt).getTime()
      }));
    });

    // Сортируем по времени чтения (по убыванию) и берем первую
    const latestChapter = allChaptersWithTime.sort((a, b) => b.readAt - a.readAt)[0];

    return latestChapter || null;
  };

  const lastReadChapter = getLastReadChapter();

  const handleClick = () => {
    if (lastReadChapter?.titleId && lastReadChapter?.chapterId) {
      router.push(`/browse/${lastReadChapter.titleId}/chapter/${lastReadChapter.chapterId}`);
    }
  };

  if (readingHistoryLoading) {
    return (
      <Button
        variant="outline"
        className={`w-full justify-start ${className}`}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загрузка...
      </Button>
    );
  }

  if (!lastReadChapter) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className={`w-full justify-start ${className}`}
      onClick={handleClick}
    >
      <BookOpen className="mr-2 h-4 w-4" />
      Продолжить чтение
    </Button>
  );
}