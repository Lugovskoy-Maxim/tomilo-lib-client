import Button from "@/shared/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Title, Chapter } from "@/types/title";
import { ReadingHistoryEntry } from "@/types/store";
import { checkAgeVerification } from "@/shared/modal/AgeVerificationModal";
import { useState, useEffect } from "react";
import { getChapterPath } from "@/lib/title-paths";

interface ReadButtonProps {
  titleData: Title;
  className?: string;
  chapters: Chapter[];
  readingHistory?: ReadingHistoryEntry;
  onAgeVerificationRequired?: () => void;
}

export function ReadButton({
  titleData,
  className,
  chapters,
  readingHistory,
  onAgeVerificationRequired,
}: ReadButtonProps) {
  const { user, readingHistoryLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const userHistoryArray = Array.isArray(user?.readingHistory) ? user.readingHistory : [];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Находим следующую главу для чтения
  const getNextChapter = () => {
    // Проверяем, что titleData и chapters существуют
    if (!titleData || !chapters || chapters.length === 0) return null;

    // Сортируем главы по номеру главы
    const sortedChapters = [...chapters].sort((a, b) => {
      // Обрабатываем случаи, когда chapterNumber может быть undefined
      const aNum = a.chapterNumber ?? 0;
      const bNum = b.chapterNumber ?? 0;
      return aNum - bNum;
    });

    // Если есть продолжение чтения и оно относится к текущему тайтлу
    const readingHistoryItem =
      readingHistory ||
      userHistoryArray.find((item: ReadingHistoryEntry) => {
        const titleId = typeof item.titleId === "string" ? item.titleId : item.titleId?._id;
        return titleId === titleData?._id;
      });

    if (
      readingHistoryItem &&
      readingHistoryItem.chapters &&
      Array.isArray(readingHistoryItem.chapters) &&
      readingHistoryItem.chapters.length > 0
    ) {
      // Находим последнюю прочитанную главу по времени чтения
      const lastReadChapter = readingHistoryItem.chapters.reduce((latest, current) => {
        const latestTime = new Date(latest.readAt).getTime();
        const currentTime = new Date(current.readAt).getTime();
        return currentTime > latestTime ? current : latest;
      });

      // Используем chapterNumber из истории чтения
      const lastReadNumber = lastReadChapter.chapterNumber;

      if (lastReadNumber !== undefined) {
        // Ищем следующую главу по номеру
        const nextChapter = sortedChapters.find(ch => ch.chapterNumber > lastReadNumber);

        if (nextChapter) {
          return nextChapter;
        }

        // Если следующих глав нет, возвращаем последнюю прочитанную
        const currentChapter = sortedChapters.find(ch => ch.chapterNumber === lastReadNumber);
        if (currentChapter) {
          return currentChapter;
        }
      } else {
        // Fallback если chapterNumber не доступен в истории
        const currentChapter = chapters.find(ch => ch._id === lastReadChapter.chapterId);

        if (currentChapter) {
          const nextChapters = chapters
            .filter(ch => ch.chapterNumber > currentChapter.chapterNumber)
            .sort((a, b) => a.chapterNumber - b.chapterNumber);

          if (nextChapters.length > 0) {
            return nextChapters[0];
          }

          return currentChapter;
        }
      }
    }

    // Если нет продолжения чтения или не удалось определить следующую главу, возвращаем первую главу
    return sortedChapters[0];
  };

  const nextChapter = getNextChapter();

  const handleClick = () => {
    if (nextChapter && titleData?._id) {
      if (titleData.ageLimit >= 18 && !checkAgeVerification()) {
        onAgeVerificationRequired?.();
        return;
      }

      router.push(getChapterPath(titleData, nextChapter._id));
    }
  };

  // Определяем текст кнопки
  let buttonText = "С первой главы";
  let showIcon = true;

  // Если есть продолжение чтения для этого тайтла
  const readingHistoryItem =
    readingHistory ||
    userHistoryArray.find((item: ReadingHistoryEntry) => {
      const titleId = typeof item.titleId === "string" ? item.titleId : item.titleId?._id;
      return titleId === titleData?._id;
    });

  if (
    readingHistoryItem &&
    readingHistoryItem.chapters &&
    Array.isArray(readingHistoryItem.chapters) &&
    readingHistoryItem.chapters.length > 0
  ) {
    if (nextChapter) {
      buttonText = `Продолжить с главы ${nextChapter.chapterNumber}`;
    } else {
      buttonText = "Продолжить чтение";
    }
    showIcon = false;
  }

  // Если нет глав, кнопка неактивна
  const isDisabled = !nextChapter;

  // Показываем состояние загрузки только на клиенте
  if (readingHistoryLoading && isClient) {
    return (
      <Button variant="primary" className={`w-full justify-center ${className}`} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загрузка...
      </Button>
    );
  }

  // Для предотвращения гидрационной ошибки, показываем одинаковый контент на сервере и клиенте
  const displayButtonText = isClient ? buttonText : "С первой главы";
  const displayShowIcon = isClient ? showIcon : true;

  return (
    <>
      <Button
        variant="primary"
        className={`w-full cursor-pointer rounded-xl hover:bg-[var(--chart-1)]/80 justify-center bg-[var(--chart-1)] text-[var(--foreground)] ${className}`}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {displayShowIcon && <Play className="mr-2 h-5 w-5" />}
        {displayButtonText}
      </Button>
    </>
  );
}
