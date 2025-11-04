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

  const handleClick = () => {
    if (continueReading?.titleId && continueReading?.chapterId) {
      router.push(`/browse/${continueReading.titleId}/chapter/${continueReading.chapterNumber}`);
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

  if (continueReadingError || !continueReading) {
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