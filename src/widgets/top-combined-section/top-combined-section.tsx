"use client";
import { ExternalLink, Trophy } from "lucide-react";
import Link from "next/link";
import TopTitleGridCard from "@/shared/top-title-grid-card/top-title-grid-card";
import { TopTitle } from "@/types/constants";

interface CombinedTopData {
  topManhwa: TopTitle[];
  topManhua: TopTitle[];
  top2025: TopTitle[];
}

interface TopCombinedSectionProps {
  data: CombinedTopData;
}

/**
 * Компонент для отображения объединенной секции топ манхв, маньхуа и новинок 2025 в 3 столбца
 */
export default function TopCombinedSection({ data }: TopCombinedSectionProps) {
  // Объединяем данные из всех трех категорий
  const combinedData = [
    ...(data.topManhwa || []).map(item => ({ ...item, category: "Манхва", isAdult: item.isAdult ?? false })),
    ...(data.topManhua || []).map(item => ({ ...item, category: "Маньхуа", isAdult: item.isAdult ?? false })),
    ...(data.top2025 || []).map(item => ({ ...item, category: "Новинки 2025", isAdult: item.isAdult ?? false }))
  ].slice(0, 12); // Ограничиваем 12 элементами (4 в каждом столбце)

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 text-[var(--muted-foreground)]">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--muted-foreground)]">
              Топ Манхв, Маньхуа и Новинки 2025
            </h2>
          </div>
          
          <div className="flex justify-between items-center w-full">
            <p className="text-[var(--muted-foreground)] text-sm max-w-2xl">
              Лучшие манхвы, маньхуа и новинки 2025 года в одном списке
            </p>
            
            <Link
              href="/top"
              className="text-[var(--chart-1)] hover:underline flex items-center gap-1 whitespace-nowrap ml-4"
            >
              <ExternalLink className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid с карточками - 3 колонки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {combinedData.length > 0 ? (
          combinedData.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              data-card-id={item.id}
              className="w-full"
            >
              <TopTitleGridCard data={item} />
            </div>
          ))
        ) : (
          <div className="col-span-3 flex justify-center items-center h-32 text-[var(--muted-foreground)]">
            Нет данных для отображения
          </div>
        )}
      </div>
    </section>
  );
}