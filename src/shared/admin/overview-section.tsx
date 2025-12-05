import {
  Plus,
  Download,
  BookOpen,
  FileText,
  Users,
  Eye,
  Star,
  Loader2,
} from "lucide-react";
import { useGetStatsQuery } from "@/store/api/statsApi";

type AdminTab = "overview" | "parser" | "titles" | "chapters";

interface OverviewSectionProps {
  onTabChange: (tab: AdminTab) => void;
}

export function OverviewSection({ onTabChange }: OverviewSectionProps) {
  const { data: statsData, isLoading, error } = useGetStatsQuery();

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-3 border rounded-lg transition-colors hover:bg-[var(--accent)] text-left flex flex-col items-center gap-2 ${
                colorClasses[action.color as keyof typeof colorClasses]
              }`}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Недавняя активность
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)] text-sm">
                Добавлен новый тайтл &ldquo;One Piece&rdquo;
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                2 часа назад
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)] text-sm">
                Импортировано 5 глав из внешнего источника
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                4 часа назад
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--foreground)] text-sm">
                Зарегистрирован новый пользователь
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                6 часов назад
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
