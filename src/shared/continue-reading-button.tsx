import Button from "@/shared/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ContinueReadingButtonProps {
  className?: string;
}

export function ContinueReadingButton({ className }: ContinueReadingButtonProps) {
  const { continueReading, continueReadingLoading, continueReadingError } = useAuth() as {
    continueReading: {
      titleId: string;
      chapters: {
        chapterId: string;
        readAt: string;
      }[];
    }[] | undefined;
    continueReadingLoading: boolean;
    continueReadingError: unknown;
  };
  const router = useRouter();

  // Получаем последнюю прочитанную главу из последнего тайтла
  const getLastReadChapter = () => {
    if (!continueReading || continueReading.length === 0) return null;
    
    // Берем последний тайтл из истории
    const lastTitle = continueReading[continueReading.length - 1];
    if (!lastTitle.chapters || lastTitle.chapters.length === 0) return null;
    
    // Берем последнюю главу из этого тайтла
    const lastChapter = lastTitle.chapters[lastTitle.chapters.length - 1];
    return {
      titleId: lastTitle.titleId,
      chapterId: lastChapter.chapterId
    };
  };

  const lastReadChapter = getLastReadChapter();

  const handleClick = () => {
    if (lastReadChapter?.titleId && lastReadChapter?.chapterId) {
      router.push(`/browse/${lastReadChapter.titleId}/chapter/${lastReadChapter.chapterId}`);
    }
  };

  if (continueReadingLoading) {
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

  if (continueReadingError || !lastReadChapter) {
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