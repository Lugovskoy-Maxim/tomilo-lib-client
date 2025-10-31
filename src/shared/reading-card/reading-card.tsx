"use client"
import { BookOpen, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png"; 

interface ReadingItem {
  id: string; // Изменено на string
  title: string;
  type: string;
  currentChapter: number;
  totalChapters: number;
  chaptersRead: number;
  cover: string;
}

interface ReadingCardProps {
  data: ReadingItem;
}

export default function ReadingCard({ data }: ReadingCardProps) {
  const router = useRouter();

  const getProgressPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const handleClick = () => {
    router.push(`/browse/${data.id}`);
  };

  // Формируем корректный URL для изображения
  const getImageUrl = () => {
    if (!data.cover) return IMAGE_HOLDER;
    
    // Если изображение уже полный URL, используем как есть
    if (data.cover.startsWith('http')) {
      return data.cover;
    }
    
    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3001'}${data.cover}`;
  };

  const imageUrl = getImageUrl();

  return (
    <div
      className="flex-shrink-0 w-68 sm:w-72 md:w-80 lg:w-96 bg-muted rounded-lg overflow-hidden group transition-all cursor-pointer"
      data-card-id={data.id}
      onClick={handleClick}
    >
      <div className="flex h-32 sm:h-36">
        {/* Картинка слева */}
        <div className="relative w-24 sm:w-28 md:w-32 flex-shrink-0">
          <div className="relative w-full h-full">
            <Image
            loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
              unoptimized
              onError={(e) => {
                // Если изображение не загружается, показываем заглушку
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
          </div>

          {/* тип на картинке */}
          <div className="absolute bottom-2 left-2 bg-muted text-primary px-1 py-0 rounded-sm flex items-center gap-1 text-xs sm:text-sm font-normal">
            {data.type}
          </div>
        </div>

        {/* Контент справа */}
        <div className="relative flex-1 p-3 sm:p-4 min-w-0">
          {/* Название */}
          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight text-sm sm:text-base mb-2 group-hover:text-primary transition-colors">
            {data.title}
          </h3>

          {/* Информация о чтении */}
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">
                {data.currentChapter} / {data.totalChapters} глав
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-muted/50 flex-shrink-0" />
              <span className="text-muted/50 truncate">
                +{data.chaptersRead} новых глав
              </span>
            </div>

            {/* Прогресс чтения */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
              <div className="text-muted/50 text-xs font-semibold text-center">
                Глава {data.currentChapter}
              </div>
              <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{
                    width: `${getProgressPercentage(
                      data.currentChapter,
                      data.totalChapters
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}