"use client";
import { Clock, Plus } from "lucide-react";

interface LatestUpdateCardProps {
  data: {
    id: number;
    title: string;
    chapterNumber: number;
    timeAgo: string;
    newChapters?: number;
    image: string;
    type?: string;
  };
}

export default function LatestUpdateCard({ data }: LatestUpdateCardProps) {
  return (
    <div className="w-full bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-200 overflow-hidden group cursor-pointer">
      <div className="flex">
        {/* Картинка слева */}
        <div className="relative w-16 h-20 flex-shrink-0">
          <div
            className="w-full h-full bg-cover bg-center rounded-l-lg"
            style={{ backgroundImage: `url(${data.image})` }}
          />

          {/* Бейдж типа (если есть) */}
          {data.type && (
            <div className="absolute bottom-1 left-1 bg-[var(--muted)] text-[var(--primary)] px-1 py-0.5 rounded text-xs font-medium">
              {data.type}
            </div>
          )}
        </div>

        {/* Контент справа */}
        <div className="flex flex-col flex-1 p-3 justify-between min-w-0">
          {/* Заголовок */}
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 leading-tight text-sm group-hover:text-[var(--primary)] transition-colors">
            {data.title}
          </h3>

          {/* Информация о главе и времени */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Номер главы */}
              <span className="text-[var(--foreground)] font-medium text-sm">
                Глава {data.chapterNumber}
              </span>

              {/* Количество новых глав (если есть) */}
              {data.newChapters && data.newChapters > 0 && (
                <div className="flex items-center gap-1 bg-[var(--sidebar-border)] text-[var(--chart-1)] px-2 py-1 rounded text-xs font-medium">
                  <Plus className="w-3 h-3" />
                  <span>
                    {data.newChapters}{" "}
                    {data.newChapters === 1
                      ? "глава"
                      : data.newChapters >= 2 && data.newChapters <= 4
                      ? "главы"
                      : "глав"}
                  </span>
                </div>
              )}
            </div>

            {/* Время обновления */}
            <div className="flex items-center gap-1 text-[var(--muted-foreground)] text-xs">
              <Clock className="w-3 h-3" />
              <span>{data.timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
