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

    // Находим тайтл с самой поздней датой чтения
    const latestTitle = user.readingHistory.reduce((latest, current) => {
      const latestTime = new Date(latest.readAt).getTime();
      const currentTime = new Date(current.readAt).getTime();
      return currentTime > latestTime ? current : latest;
    });

    // Находим последнюю прочитанную главу в этом тайтле
    if (latestTitle.chapters && latestTitle.chapters.length > 0) {
      const lastChapter = latestTitle.chapters.reduce((latest, current) => {
        const latestTime = new Date(latest.readAt).getTime();
        const currentTime = new Date(current.readAt).getTime();
        return currentTime > latestTime ? current : latest;
      });

      return {
        titleId: latestTitle.titleId,
        chapterId: lastChapter.chapterId
      };
    }

    return null;
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