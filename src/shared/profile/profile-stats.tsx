"use client";
import { BookOpen, Clock, Star, BarChart3 } from "lucide-react";
import { ReadingStats } from "@/types/user";

interface ProfileStatsProps {
  stats: ReadingStats;
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}мин` : `${hours}ч`;
  };

  const statCards = [
    {
      icon: BookOpen,
      label: "Прочитано манги",
      value: stats.totalMangaRead,
      color: "text-blue-500"
    },
    {
      icon: BarChart3,
      label: "Прочитано глав",
      value: stats.totalChaptersRead,
      color: "text-green-500"
    },
    {
      icon: Clock,
      label: "Время чтения",
      value: formatReadingTime(stats.readingTime),
      color: "text-purple-500"
    },
    {
      icon: Star,
      label: "Любимых жанров",
      value: stats.favoriteGenres.length,
      color: "text-yellow-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-[var(--secondary)] rounded-xl p-4 border border-[var(--border)]"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-[var(--primary)]/10`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stat.value}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}