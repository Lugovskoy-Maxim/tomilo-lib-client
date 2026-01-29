import {
  Plus,
  Download,
  BookOpen,
  FileText,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Award,

  Bookmark,
  Layers,
} from "lucide-react";
import { useGetStatsQuery } from "@/store/api/statsApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useState } from "react";
import type { StatsResponse } from "@/types/stats";


// Helper function for formatting numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

type AdminTab = "overview" | "parser" | "titles" | "chapters";

interface OverviewSectionProps {
  onTabChange: (tab: AdminTab) => void;
}

// Component to display popular chapter with title info
function PopularChapterItem({
  chapter,
  index,
}: {
  chapter: StatsResponse["popularChapters"][0];
  index: number;
}) {
  // Fetch title information if titleName is missing
  const hasValidTitleName = chapter.titleName && chapter.titleName.trim() !== "";
  const shouldSkipFetch = hasValidTitleName || !chapter.titleId;
  const { data: titleData, isLoading: isTitleLoading } = useGetTitleByIdQuery(
    { id: chapter.titleId },
    { skip: shouldSkipFetch }
  );

  // Determine the title name to display
  let displayTitleName = "Неизвестный тайтл";
  if (hasValidTitleName) {
    displayTitleName = chapter.titleName;
  } else if (titleData && !isTitleLoading) {
    displayTitleName = titleData.name;
  }

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-[var(--accent)]/30 transition-colors">
      <span className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xs font-medium text-yellow-700 dark:text-yellow-300 shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--foreground)] truncate">{chapter.name}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate" title={displayTitleName}>
          {displayTitleName}
        </p>
      </div>
      <span className="text-xs font-medium text-[var(--primary)] shrink-0 ml-2">
        {formatNumber(chapter.views)}
      </span>
    </div>
  );
}

export function OverviewSection({ onTabChange }: OverviewSectionProps) {
  const { data: statsData, isLoading, error } = useGetStatsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [modalContent] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const stats = statsData?.data;

  const periodData = stats?.[activePeriod] || {
    views: 0,
    newUsers: 0,
    newTitles: 0,
    newChapters: 0,
    chaptersRead: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
              <div className="h-4 w-12 bg-[var(--muted)] rounded animate-pulse mb-2"></div>
              <div className="h-6 w-16 bg-[var(--muted)] rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800 font-medium">Ошибка загрузки статистики</p>
        <p className="text-red-600 text-sm mt-1">Не удалось получить данные с сервера</p>
      </div>
    );
  }

  const quickActions = [
    { icon: Plus, label: "Создать", action: () => onTabChange("titles"), color: "blue" },
    { icon: Download, label: "Парсинг", action: () => onTabChange("parser"), color: "green" },
    { icon: BookOpen, label: "Тайтлы", action: () => onTabChange("titles"), color: "purple" },
    { icon: FileText, label: "Главы", action: () => onTabChange("chapters"), color: "orange" },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={BookOpen}
          value={stats.totalTitles}
          label="Тайтлы"
          color="blue"
          subtitle={`${stats.ongoingTitles} актив.`}
        />
        <StatCard icon={FileText} value={stats.totalChapters} label="Главы" color="green" />
        <StatCard
          icon={Users}
          value={stats.totalUsers}
          label="Пользователи"
          color="purple"
          subtitle={`${stats.newUsersThisMonth} нов.`}
        />
        <StatCard icon={Eye} value={stats.totalViews} label="Просмотры" color="orange" />
        <StatCard icon={Bookmark} value={stats.totalBookmarks} label="Закладки" color="pink" />
        <StatCard icon={Layers} value={stats.totalCollections} label="Коллекции" color="cyan" />
      </div>

      {/* Period Stats */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)]">
        {/* Period Tabs */}
        <div className="flex border-b border-[var(--border)]">
          {(["daily", "weekly", "monthly"] as const).map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activePeriod === period
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)] bg-[var(--accent)]/50"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {period === "daily" ? "Сегодня" : period === "weekly" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>

        {/* Period Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4">
          <PeriodStat icon={Eye} value={periodData.views} label="Просмотры" color="blue" />
          <PeriodStat icon={Users} value={periodData.newUsers} label="Новые юзеры" color="green" />
          <PeriodStat
            icon={BookOpen}
            value={periodData.newTitles}
            label="Новые тайтлы"
            color="purple"
          />
          <PeriodStat
            icon={FileText}
            value={periodData.newChapters}
            label="Новые главы"
            color="orange"
          />
          <PeriodStat
            icon={Target}
            value={stats.averageRating}
            label="Ср. оценка"
            color="yellow"
          />
        </div>
      </div>

      {/* Two Column Layout: Popular Titles & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Popular Titles */}
        <div className="lg:col-span-2 bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
              Популярные тайтлы
            </h3>
            <button
              onClick={() => onTabChange("titles")}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Все →
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {stats.popularTitles.slice(0, 8).map((title, index) => (
              <div
                key={title.id}
                className="flex items-center gap-3 p-3 hover:bg-[var(--accent)]/30 transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center text-xs font-medium text-[var(--muted-foreground)]">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] text-sm truncate">
                    {title.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatNumber(title.views)} просмотров
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-[var(--primary)]">
                    {title.dayViews} сегодня
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatNumber(title.weekViews)} за неделю
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Actions & Top Chapters */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Действия</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--accent)] transition-colors flex flex-col items-center gap-1"
                >
                  <action.icon className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Chapters */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Топ глав
              </h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {stats.popularChapters.slice(0, 5).map((chapter, index) => (
                <PopularChapterItem key={chapter.id} chapter={chapter} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-medium text-[var(--foreground)]">Активность</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Онлайн сегодня</span>
              <span className="font-medium">{stats.activeUsersToday}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Рейтингов</span>
              <span className="font-medium">{stats.totalRatings}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Ср. оценка</span>
              <span className="font-medium">{stats.averageRating.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-[var(--foreground)]">Статус тайтлов</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Онгоинг</span>
              <span className="font-medium text-green-500">{stats.ongoingTitles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Завершённые</span>
              <span className="font-medium text-blue-500">{stats.completedTitles}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Всего</span>
              <span className="font-medium">{stats.totalTitles}</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-medium text-[var(--foreground)]">Сессия</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Новые за месяц</span>
              <span className="font-medium">{stats.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Новые сегодня</span>
              <span className="font-medium">{stats.daily.newUsers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Глав за месяц</span>
              <span className="font-medium">{formatNumber(stats.monthly.newChapters)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600 dark:text-orange-400",
    },
    pink: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400" },
    cyan: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-600 dark:text-cyan-400" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const formatValue = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{formatValue(value)}</p>
      {subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-1">{subtitle}</p>}
    </div>
  );
}

// Period Stat Component
function PeriodStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    orange: "text-orange-500",
    yellow: "text-yellow-500",
  };

  const formatValue = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${colorClasses[color] || colorClasses.blue}`} />
      <p className="text-xl font-bold text-[var(--foreground)]">{formatValue(value)}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}
