import Button from "@/shared/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Title, Chapter } from "@/types/title";

interface ReadButtonProps {
  titleData: Title;
  className?: string;
  chapters: Chapter[];
}

export function ReadButton({ titleData, className, chapters }: ReadButtonProps) {
  const { continueReading, continueReadingLoading, continueReadingError } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    // Если есть продолжение чтения и оно относится к текущему тайтлу
    if (continueReading?.titleId === titleData._id && continueReading?.chapterId) {
      router.push(`/browse/${continueReading.titleId}/chapter/${continueReading.chapterNumber}`);
    } 
    // Если есть главы, переходим к первой
    else if (chapters && chapters.length > 0) {
      // Сортируем главы по номеру и берем первую
      const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
      const firstChapter = sortedChapters[0];
      router.push(`/browse/${titleData._id}/chapter/${firstChapter._id}`);
    }
  };

  if (continueReadingLoading) {
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
  if (continueReading?.titleId === titleData._id && continueReading?.chapterId) {
    buttonText = "Продолжить чтение";
    showIcon = false;
  }

  return (
    <Button 
      variant="primary" 
      className={`w-full justify-center ${className}`}
      onClick={handleClick}
    >
      {showIcon && <Play className="mr-2 h-5 w-5" />}
      {buttonText}
    </Button>
  );
}