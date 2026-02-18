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

  const getRussianPlural = (count: number, one: string, few: string, many: string): string => {
    const abs = Math.abs(count) % 100;
    const last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  };

  const formatRelativeReadAt = (
    readAt: string,
  ): { desktop: string; mobile: string; mobileCompact: string } | null => {
    const readDate = new Date(readAt);
    if (Number.isNaN(readDate.getTime())) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfReadDay = new Date(readDate.getFullYear(), readDate.getMonth(), readDate.getDate());
    const dayDiff = Math.floor(
      (startOfToday.getTime() - startOfReadDay.getTime()) / (24 * 60 * 60 * 1000),
    );

    const time = readDate.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (dayDiff <= 0) {
      return {
        desktop: `Последнее чтение: сегодня в ${time}`,
        mobile: `Читали: сегодня ${time}`,
        mobileCompact: `сегодня ${time}`,
      };
    }

    if (dayDiff === 1) {
      return {
        desktop: `Последнее чтение: вчера в ${time}`,
        mobile: `Читали: вчера ${time}`,
        mobileCompact: `вчера ${time}`,
      };
    }

    if (dayDiff < 7) {
      const daysWord = getRussianPlural(dayDiff, "день", "дня", "дней");
      return {
        desktop: `Последнее чтение: ${dayDiff} ${daysWord} назад`,
        mobile: `Читали: ${dayDiff} ${daysWord} назад`,
        mobileCompact: `${dayDiff} дн. назад`,
      };
    }

    const weeks = Math.floor(dayDiff / 7);
    if (dayDiff < 30) {
      const weeksWord = getRussianPlural(weeks, "неделю", "недели", "недель");
      return {
        desktop: `Последнее чтение: ${weeks} ${weeksWord} назад`,
        mobile: `Читали: ${weeks} ${weeksWord} назад`,
        mobileCompact: `${weeks} нед. назад`,
      };
    }

    const months = Math.floor(dayDiff / 30);
    if (dayDiff < 365) {
      const monthsWord = getRussianPlural(months, "месяц", "месяца", "месяцев");
      return {
        desktop: `Последнее чтение: ${months} ${monthsWord} назад`,
        mobile: `Читали: ${months} ${monthsWord} назад`,
        mobileCompact: `${months} мес. назад`,
      };
    }

    const years = Math.floor(dayDiff / 365);
    const yearsWord = getRussianPlural(years, "год", "года", "лет");
    return {
      desktop: `Последнее чтение: ${years} ${yearsWord} назад`,
      mobile: `Читали: ${years} ${yearsWord} назад`,
      mobileCompact: `${years} г. назад`,
    };
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
  const bestLastReadChapter = getBestLastReadChapter();
  let lastReadCaption = "";
  let lastReadCaptionShort = "";
  let lastReadCaptionCompact = "";

  // Если есть продолжение чтения для этого тайтла
  const hasReadingProgress = Boolean(bestLastReadChapter);

  if (hasReadingProgress) {
    if (nextChapter) {
      buttonText = `Продолжить с главы ${nextChapter.chapterNumber}`;
      buttonTextShort = `С главы ${nextChapter.chapterNumber}`;
    } else {
      buttonText = "Продолжить чтение";
      buttonTextShort = "Продолжить";
    }
    showIcon = false;

    if (bestLastReadChapter?.readAt) {
      const relative = formatRelativeReadAt(bestLastReadChapter.readAt);
      if (relative) {
        lastReadCaption = relative.desktop;
        lastReadCaptionShort = relative.mobile;
        lastReadCaptionCompact = relative.mobileCompact;
      }
    }
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
        className={`w-full cursor-pointer rounded-xl hover:bg-[var(--chart-1)]/80 justify-center bg-[var(--chart-1)] text-[var(--foreground)] ${className}`}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {displayShowIcon && <Play className="mr-2 h-5 w-5 shrink-0" />}
        <span className="sm:hidden flex max-w-full flex-col items-center leading-tight">
          <span className="text-sm font-medium">{displayButtonTextShort}</span>
          {isClient && hasReadingProgress && lastReadCaptionCompact && (
            <span className="mt-0.5 max-w-full truncate text-[10px] font-normal text-[var(--foreground)]/80">
              {lastReadCaptionCompact}
            </span>
          )}
        </span>
        <span className="hidden sm:flex flex-col items-center leading-tight">
          <span>{displayButtonText}</span>
          {isClient && hasReadingProgress && lastReadCaption && (
            <span className="mt-0.5 text-[10px] font-normal text-[var(--foreground)]/80">
              {lastReadCaption}
            </span>
          )}
        </span>
      </Button>
    </>
  );
}
