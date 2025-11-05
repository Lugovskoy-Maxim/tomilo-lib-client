import Button from "@/shared/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

interface ContinueReadingButtonProps {
  className?: string;
}

export function ContinueReadingButton({ className }: ContinueReadingButtonProps) {
  const { continueReading, continueReadingLoading, continueReadingError } = useAuth();
  const router = useRouter();

  // Получаем последнюю прочитанную главу из последнего тайтла
  const getLastReadChapter = () => {
    if (!continueReading || continueReading.length === 0) return null;

    // Берем последний элемент из массива continueReading
    const lastItem = continueReading[continueReading.length - 1];
    return {
      titleId: lastItem.titleId,
      chapterId: lastItem.chapterId
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