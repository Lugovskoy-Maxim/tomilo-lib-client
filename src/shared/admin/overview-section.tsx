import { Plus, Download, BookOpen, FileText, Users, Eye, Star, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGetStatsQuery } from "@/store/api/statsApi";

type AdminTab = "overview" | "parser" | "titles" | "chapters";

interface OverviewSectionProps {
  onTabChange: (tab: AdminTab) => void;
}

export function OverviewSection({ onTabChange }: OverviewSectionProps) {
  const { data: statsData, isLoading, error } = useGetStatsQuery();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = statsData?.data ? [
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
  ] : [];

  const quickActions = [
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

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--secondary)] rounded-lg">
                  <Loader2 className="w-6 h-6 text-[var(--muted-foreground)] animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-[var(--muted)] rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-[var(--muted)] rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800 font-medium">Ошибка загрузки статистики</p>
            <p className="text-red-600 text-sm mt-1">
              Не удалось получить данные с сервера
            </p>
          </div>
        ) : (
          stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--secondary)] rounded-lg">
                  <stat.icon className="w-6 h-6 text-[var(--muted-foreground)]" />
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
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
          Быстрые действия
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-4 border rounded-lg transition-colors hover:bg-[var(--accent)] text-left ${
                colorClasses[action.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-center gap-3">
                <action.icon className="w-5 h-5" />
                <span className="font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
          Недавняя активность
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)]">
                Добавлен новый тайтл &ldquo;One Piece&rdquo;
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                2 часа назад
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)]">
                Импортировано 5 глав из внешнего источника
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                4 часа назад
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)]">
                Зарегистрирован новый пользователь
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                6 часов назад
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
