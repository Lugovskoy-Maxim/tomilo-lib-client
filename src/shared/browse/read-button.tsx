import Button from "@/shared/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Title, Chapter } from "@/types/title";
import { ReadingHistoryEntry } from "@/types/store";
import { checkAgeVerification } from "@/shared/modal/age-verification-modal";

interface ReadButtonProps {
  titleData: Title;
  className?: string;
  chapters: Chapter[];
  onAgeVerificationRequired?: () => void;
}

export function ReadButton({
  titleData,
  className,
  chapters,
  onAgeVerificationRequired,
}: ReadButtonProps) {
  const { user, readingHistoryLoading } = useAuth();
  const router = useRouter();

  // Находим следующую главу для чтения
  const getNextChapter = () => {
    // Проверяем, что titleData существует
    if (!titleData) return null;

    // Если есть продолжение чтения и оно относится к текущему тайтлу
    const readingHistoryItem = user?.readingHistory?.find(
      (item: ReadingHistoryEntry) => {
        const titleId = typeof item.titleId === 'string' ? item.titleId : item.titleId?._id;
        return titleId === titleData?._id;
      }
    );

    if (readingHistoryItem && readingHistoryItem.chapters && Array.isArray(readingHistoryItem.chapters) && readingHistoryItem.chapters.length > 0) {
      // Находим последнюю прочитанную главу по времени чтения
      const lastReadChapter = readingHistoryItem.chapters.reduce((latest, current) => {
        const latestTime = new Date(latest.readAt).getTime();
        const currentTime = new Date(current.readAt).getTime();
        return currentTime > latestTime ? current : latest;
      });

      // Используем chapterNumber из истории чтения
      const lastReadNumber = lastReadChapter.chapterNumber;

      if (lastReadNumber !== undefined) {
        const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

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

        // Если не нашли, возвращаем первую главу
        return sortedChapters[0];
      } else {
        // Fallback to old logic if chapterNumber not available
        const currentChapter = chapters.find(
          (ch) => ch._id === lastReadChapter.chapterId
        );

        if (currentChapter) {
          const nextChapters = chapters.filter(
            (ch) => ch.chapterNumber > currentChapter.chapterNumber
          ).sort((a, b) => a.chapterNumber - b.chapterNumber);

          if (nextChapters.length > 0) {
            return nextChapters[0];
          }

          return currentChapter;
        } else {
          const sortedChapters = [...chapters].sort(
            (a, b) => a.chapterNumber - b.chapterNumber
          );
          return sortedChapters[0];
        }
      }
    }

    // Если нет продолжения чтения, возвращаем первую главу
    if (chapters && chapters.length > 0) {
      const sortedChapters = [...chapters].sort(
        (a, b) => a.chapterNumber - b.chapterNumber
      );
      return sortedChapters[0];
    }

    return null;
  };

  const nextChapter = getNextChapter();

  const handleClick = () => {
    if (nextChapter && titleData?._id) {
      if (titleData.ageLimit >= 18 && !checkAgeVerification()) {
        onAgeVerificationRequired?.();
        return;
      }
      router.push(`/browse/${titleData._id}/chapter/${nextChapter._id}`);
    }
  };

  if (readingHistoryLoading) {
    return (
      <Button
        variant="primary"
        className={`w-full justify-center ${className}`}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загрузка...
      </Button>
    );
  }


  // Определяем текст кнопки
  let buttonText = "С первой главы";
  let showIcon = true;

  // Если есть продолжение чтения для этого тайтла
  const readingHistoryItem = user?.readingHistory?.find(
    (item: ReadingHistoryEntry) => {
      const titleId = typeof item.titleId === 'string' ? item.titleId : item.titleId?._id;
      return titleId === titleData?._id;
    }
  );
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

  return (
    <Button
      variant="primary"
      className={`w-full cursor-pointer rounded-full hover:bg-[var(--chart-1)]/80 justify-center bg-[var(--chart-1)] text-[var(--foreground)] ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {showIcon && <Play className="mr-2 h-5 w-5" />}
      {buttonText}
    </Button>
  );
}
