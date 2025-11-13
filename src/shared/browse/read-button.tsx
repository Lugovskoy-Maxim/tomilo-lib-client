import Button from "@/shared/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Title, Chapter } from "@/types/title";
import { User } from "@/types/auth";

interface ReadButtonProps {
  titleData: Title;
  className?: string;
  chapters: Chapter[];
}

export function ReadButton({
  titleData,
  className,
  chapters,
}: ReadButtonProps) {
  const { user, readingHistoryLoading } = useAuth();
  const router = useRouter();

  // Находим следующую главу для чтения
  const getNextChapter = () => {
    // Если есть продолжение чтения и оно относится к текущему тайтлу
    const readingHistoryItem = user?.readingHistory?.find(
      (item: User['readingHistory'][0]) => item.titleId._id === titleData._id
    );
    if (
      readingHistoryItem &&
      readingHistoryItem.chapters &&
      readingHistoryItem.chapters.length > 0
    ) {
      // Получаем последнюю прочитанную главу
      const lastReadChapter =
        readingHistoryItem.chapters[readingHistoryItem.chapters.length - 1];
      // Находим главу по chapterId
      const currentChapter = chapters.find(
        (ch) => ch._id === lastReadChapter.chapterId._id
      );
      if (currentChapter) {
        // Ищем следующую главу по номеру
        const nextChapters = chapters.filter(
          (ch) => ch.chapterNumber > currentChapter.chapterNumber
        );
        if (nextChapters.length > 0) {
          // Сортируем по номеру и берем первую
          const sortedNextChapters = nextChapters.sort(
            (a, b) => a.chapterNumber - b.chapterNumber
          );
          return sortedNextChapters[0];
        }
        // Если следующих глав нет, возвращаем текущую
        return currentChapter;
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
    if (nextChapter) {
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
    (item: User['readingHistory'][0]) => item.titleId._id === titleData._id
  );
  if (
    readingHistoryItem &&
    readingHistoryItem.chapters &&
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
      className={`w-full cursor-pointer hover:bg-[var(--chart-1)]/80 justify-center bg-[var(--chart-1)] text-[var(--foreground)] ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {showIcon && <Play className="mr-2 h-5 w-5" />}
      {buttonText}
    </Button>
  );
}
