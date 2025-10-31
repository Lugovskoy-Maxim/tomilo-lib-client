"use client";
import { Clock, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import IMAGE_HOLDER from "../../../public/404/image-holder.png";

interface LatestUpdateCardProps {
  data: {
    id: string; // Изменено на string
    title: string;
    chapterNumber: number;
    timeAgo: string;
    newChapters?: number;
    cover: string; // Изменено с image на cover
    type?: string;
  };
}

export default function LatestUpdateCard({ data }: LatestUpdateCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/browse/${data.id}`);
  };

  const getImageUrl = () => {
    console.log(data);
    if (!data.cover) return IMAGE_HOLDER;

    // Если изображение уже полный URL, используем как есть
    if (data.cover.startsWith("http")) {
      return data.cover;
    }

    // Если относительный путь, добавляем базовый URL
    return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3001"}${
      data.cover
    }`;
  };

  const imageUrl = getImageUrl();

  // Функция для склонения слова "глава"
  const getChaptersText = (count: number) => {
    if (count === 1) return "глава";
    if (count >= 2 && count <= 4) return "главы";
    return "глав";
  };

  return (
    <div
      className="w-full bg-card rounded-lg border border-border hover:border-primary transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex">
        {/* Картинка слева */}
        <div className="relative w-16 h-20 flex-shrink-0">
          <div className="relative w-full h-full rounded-l-lg overflow-hidden">
            <Image
              loader={() => `${imageUrl}`}
              src={imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = IMAGE_HOLDER.src;
              }}
            />
          </div>

          {/* Бейдж типа (если есть) */}
          {data.type && (
            <div className="absolute bottom-1 left-1 bg-muted text-primary px-1 py-0.5 rounded text-xs font-medium">
              {data.type}
            </div>
          )}
        </div>

        {/* Контент справа */}
        <div className="flex flex-col flex-1 p-3 justify-between min-w-0">
          {/* Заголовок */}
          <h3 className="font-semibold text-foreground line-clamp-1 leading-tight text-sm group-hover:text-primary transition-colors">
            {data.title}
          </h3>

          {/* Информация о главе и времени */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Номер главы */}
              <span className="text-foreground font-medium text-sm">
                Глава {data.chapterNumber}
              </span>

              {/* Количество новых глав (если есть) */}
              {data.newChapters && data.newChapters > 0 && (
                <div className="flex items-center gap-1 bg-sidebar-border text-chart-1 px-2 py-1 rounded text-xs font-medium">
                  <Plus className="w-3 h-3" />
                  <span>
                    {data.newChapters} {getChaptersText(data.newChapters)}
                  </span>
                </div>
              )}
            </div>

            {/* Время обновления */}
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              <span>{data.timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
