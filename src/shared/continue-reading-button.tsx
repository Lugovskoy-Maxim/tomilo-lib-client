"use client";


import Button from "@/shared/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useGetChapterByNumberQuery } from "@/store/api/chaptersApi";
import { useEffect, useState } from "react";
import { getChapterPath } from "@/lib/title-paths";

interface ContinueReadingButtonProps {
  className?: string;
}

export function ContinueReadingButton({ className }: ContinueReadingButtonProps) {
  const { user, readingHistoryLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Используем новый API endpoint для получения главы по номеру
  const { data: chapterData, isLoading: chapterLoading } = useGetChapterByNumberQuery(
    {
      titleId: lastReadChapter?.titleId || '',
      chapterNumber: lastReadChapter?.chapterNumber || 0
    },
    { skip: !lastReadChapter?.titleId || !lastReadChapter?.chapterNumber }
  );


  const handleClick = () => {
    // Используем ID главы из нового API endpoint если доступен, иначе из истории
    const chapterId = chapterData?._id || lastReadChapter?.chapterId;
    if (lastReadChapter?.titleId && chapterId) {
      // Создаем объект тайтла для передачи в getChapterPath
      const title = { id: lastReadChapter.titleId, slug: undefined };
      router.push(getChapterPath(title, chapterId));
    }
  };

  // Показываем состояние загрузки только на клиенте
  if ((readingHistoryLoading || chapterLoading) && isClient) {
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