import {
  Plus,
  Download,
  BookOpen,
  FileText,
  Users,
  Eye,
  Star,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useGetStatsQuery } from "@/store/api/statsApi";
import { useGetLatestUpdatesQuery } from "@/store/api/titlesApi";
import { useCleanupOrphanedChaptersMutation } from "@/store/api/chaptersApi";
import { timeAgo } from "@/lib/date-utils";
import { useState } from "react";

type AdminTab = "overview" | "parser" | "titles" | "chapters";

interface OverviewSectionProps {
  onTabChange: (tab: AdminTab) => void;
}

export function OverviewSection({ onTabChange }: OverviewSectionProps) {
  const { data: statsData, isLoading, error } = useGetStatsQuery();
  const {
    data: updatesData,
    isLoading: updatesLoading,
    error: updatesError,
  } = useGetLatestUpdatesQuery();
  const [cleanupOrphanedChapters] = useCleanupOrphanedChaptersMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toString();
  };

  const stats = statsData?.data
    ? [
        {
          icon: BookOpen,
          value: formatNumber(statsData.data.totalTitles),
          label: "Тайтлов",
          color: "blue",
        },
        {
          icon: FileText,
          value: formatNumber(statsData.data.totalChapters),
          label: "Глав",
          color: "green",
        },
        {
          icon: Users,
          value: formatNumber(statsData.data.totalUsers),
          label: "Пользователей",
          color: "purple",
        },
        {
          icon: Eye,
          value: formatNumber(statsData.data.totalViews),
          label: "Просмотров",
          color: "orange",
        },
        {
          icon: Star,
          value: formatNumber(statsData.data.totalBookmarks),
          label: "Закладок",
          color: "yellow",
        },
      ]
    : [];

  const handleCleanupOrphanedChapters = async () => {
    if (
      !confirm(
        "Вы уверены, что хотите удалить все осиротевшие главы (главы без тайтлов)? Это действие нельзя отменить."
      )
    )
      return;
    try {
      const result = await cleanupOrphanedChapters().unwrap();
      setModalContent({
        title: "Очистка завершена",
        message: `Удалено ${result.data?.deletedCount || 0} осиротевших глав`,
      });
      setIsModalOpen(true);
    } catch (error) {
      setModalContent({
        title: "Ошибка очистки",
        message: "Произошла ошибка при удалении осиротевших глав",
      });
      setIsModalOpen(true);
    }
  };

  const quickActions = [
    {
      icon: Trash2,
      label: "Очистить осиротевшие главы",
      action: handleCleanupOrphanedChapters,
      color: "red",
    },
    {
      icon: Plus,
      label: "Создать тайтл",
      action: () => onTabChange("titles"),
      color: "blue",
    },
    {
      icon: Download,
      label: "Запустить парсинг",
      action: () => onTabChange("parser"),
      color: "green",
    },
    {
      icon: BookOpen,
      label: "Управление тайтлами",
      action: () => onTabChange("titles"),
      color: "purple",
    },
    {
      icon: FileText,
      label: "Управление главами",
      action: () => onTabChange("chapters"),
      color: "orange",
    },
  ];

  const getChaptersText = (count: number) => {
    if (count === 1) return "глава";
    if (count >= 2 && count <= 4) return "главы";
    return "глав";
  };

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-3"
            >
              <div className="p-2 bg-[var(--secondary)] rounded-lg">
                <Loader2 className="w-5 h-5 text-[var(--muted-foreground)] animate-spin" />
              </div>
              <div className="flex-1">
                <div className="h-6 bg-[var(--muted)] rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-[var(--muted)] rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium text-sm">
              Ошибка загрузки статистики
            </p>
            <p className="text-red-600 text-xs mt-1">
              Не удалось получить данные с сервера
            </p>
          </div>
        ) : (
          stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex items-center gap-3"
            >
              <div className="p-2 bg-[var(--secondary)] rounded-lg">
                <stat.icon className="w-5 h-5 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-3 border rounded-lg transition-colors hover:bg-[var(--accent)] text-left flex flex-col items-center gap-2 ${
                colorClasses[action.color as keyof typeof colorClasses]
              }`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Updates */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Последние обновления
        </h2>
        <div className="space-y-3">
          {updatesLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg"
              >
                <div className="p-2 bg-[var(--secondary)] rounded-lg">
                  <Loader2 className="w-4 h-4 text-[var(--muted-foreground)] animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-[var(--muted)] rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-[var(--muted)] rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))
          ) : updatesError ? (
            // Error state
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 font-medium text-sm">
                Ошибка загрузки обновлений
              </p>
              <p className="text-red-600 text-xs mt-1">
                Не удалось получить последние обновления
              </p>
            </div>
          ) : (
            updatesData?.data?.slice(0, 3).map((update, index) => (
              <div
                key={update.id || index}
                className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)] text-sm">
                    {update.title}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {update.chapterNumber}{" "}
                    {getChaptersText(update.chapterNumber)} •{" "}
                    {timeAgo(update.timeAgo)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Result Modal */}
      {isModalOpen && modalContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              {modalContent.title.includes("Ошибка") ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {modalContent.title}
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6">
              {modalContent.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
