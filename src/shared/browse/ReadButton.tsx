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

  type LastReadChapterLike = {
    chapterId: string;
    chapterNumber?: number;
    readAt: string;
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getUserHistoryItemByTitle = (): ReadingHistoryEntry | null => {
    return (
      userHistoryArray.find((item: ReadingHistoryEntry) => {
        const titleId = typeof item.titleId === "string" ? item.titleId : item.titleId?._id;
        return titleId === titleData?._id;
      }) || null
    );
  };

  const toHistoryChapter = (chapter: unknown): LastReadChapterLike | null => {
    if (!chapter || typeof chapter !== "object") return null;

    const raw = chapter as {
      chapterId?: string | { _id?: string | null } | null;
      chapterNumber?: number | string | null;
      readAt?: string | null;
    };

    if (!raw.chapterId || !raw.readAt) return null;

    const chapterId =
      typeof raw.chapterId === "object"
        ? (raw.chapterId as { _id?: string | null })._id || ""
        : String(raw.chapterId);

    if (!chapterId) return null;

    const parsedNumber =
      raw.chapterNumber === null || raw.chapterNumber === undefined
        ? undefined
        : Number(raw.chapterNumber);

    return {
      chapterId,
      chapterNumber: Number.isFinite(parsedNumber) ? parsedNumber : undefined,
      readAt: raw.readAt,
    };
  };

  const getLastReadChapter = (historyItem: ReadingHistoryEntry | null): LastReadChapterLike | null => {
    if (!historyItem) return null;

    if (Array.isArray(historyItem.chapters) && historyItem.chapters.length > 0) {
      const normalizedChapters = historyItem.chapters
        .map(ch => toHistoryChapter(ch))
        .filter((ch): ch is LastReadChapterLike => Boolean(ch));

      if (normalizedChapters.length > 0) {
        return normalizedChapters.reduce((latest, current) => {
          const latestTime = new Date(latest.readAt).getTime();
          const currentTime = new Date(current.readAt).getTime();
          return currentTime > latestTime ? current : latest;
        });
      }
    }

    const rawHistory = historyItem as unknown as {
      lastChapter?: unknown;
    };

    if (rawHistory.lastChapter) {
      return toHistoryChapter(rawHistory.lastChapter);
    }

    return null;
  };

  const getBestLastReadChapter = (): LastReadChapterLike | null => {
    const fromTitleQuery = getLastReadChapter(readingHistory ?? null);
    const fromUserHistory = getLastReadChapter(getUserHistoryItemByTitle());

    if (fromTitleQuery && fromUserHistory) {
      const fromTitleTime = new Date(fromTitleQuery.readAt).getTime();
      const fromUserTime = new Date(fromUserHistory.readAt).getTime();

      if (Number.isFinite(fromTitleTime) && Number.isFinite(fromUserTime)) {
        return fromTitleTime >= fromUserTime ? fromTitleQuery : fromUserHistory;
      }

      return fromTitleQuery.chapterNumber !== undefined ? fromTitleQuery : fromUserHistory;
    }

    return fromTitleQuery || fromUserHistory;
  };

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

    const lastReadChapter = getBestLastReadChapter();

    if (lastReadChapter) {
      const lastReadNumber = lastReadChapter.chapterNumber;

      if (lastReadNumber !== undefined && Number.isFinite(lastReadNumber)) {
        const nextChapter = sortedChapters.find(ch => (ch.chapterNumber ?? 0) > lastReadNumber);

        if (nextChapter) {
          return nextChapter;
        }

        const currentChapter = sortedChapters.find(ch => (ch.chapterNumber ?? 0) === lastReadNumber);
        if (currentChapter) {
          return currentChapter;
        }

        // Если в текущем списке глав нет нужного номера (частичная загрузка),
        // открываем последнюю прочитанную из истории по chapterId.
        return {
          _id: lastReadChapter.chapterId,
          chapterNumber: lastReadNumber,
        } as Chapter;
      }

      // Fallback если chapterNumber не доступен в истории
      const currentChapter = chapters.find(ch => ch._id === lastReadChapter.chapterId);

      if (currentChapter) {
        const nextChapters = chapters
          .filter(ch => (ch.chapterNumber ?? 0) > (currentChapter.chapterNumber ?? 0))
          .sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));

        if (nextChapters.length > 0) {
          return nextChapters[0];
        }

        return currentChapter;
      }

      // Если в текущем списке глав нет lastReadChapter, всё равно продолжаем по истории.
      return {
        _id: lastReadChapter.chapterId,
        chapterNumber: lastReadNumber ?? 0,
      } as Chapter;
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
  let buttonTextShort = "Читать";
  let showIcon = true;

  // Если есть продолжение чтения для этого тайтла
  const hasReadingProgress = Boolean(getBestLastReadChapter());

  if (hasReadingProgress) {
    if (nextChapter) {
      buttonText = `Продолжить с главы ${nextChapter.chapterNumber}`;
      buttonTextShort = "Продолжить";
    } else {
      buttonText = "Продолжить чтение";
      buttonTextShort = "Продолжить";
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
  const displayButtonTextShort = isClient ? buttonTextShort : "Читать";
  const displayShowIcon = isClient ? showIcon : true;

  return (
    <>
      <Button
        variant="primary"
        className={`w-full cursor-pointer rounded-xl hover:bg-[var(--chart-1)]/80 justify-center bg-[var(--chart-1)] text-[var(--foreground)] whitespace-nowrap ${className}`}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {displayShowIcon && <Play className="mr-2 h-5 w-5 shrink-0" />}
        <span className="sm:hidden">{displayButtonTextShort}</span>
        <span className="hidden sm:inline">{displayButtonText}</span>
      </Button>
    </>
  );
}
