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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useGetStatsQuery } from "@/store/api/statsApi";
import { useGetTitleByIdQuery } from "@/store/api/titlesApi";
import { useState, useMemo } from "react";
import type { StatsResponse } from "@/types/stats";
import { AdminCard, StatCard } from "./ui";
import { formatNumber } from "@/lib/utils";

// Calculate trend percentage
function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (!previous) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    isPositive: change >= 0,
  };
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
    { skip: shouldSkipFetch },
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
  const [activePeriod, setActivePeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const stats = statsData?.data;

  const periodData = stats?.[activePeriod] || {
    views: 0,
    newUsers: 0,
    newTitles: 0,
    newChapters: 0,
    chaptersRead: 0,
  };

  // Calculate trends by comparing with previous period
  const trends = useMemo(() => {
    if (!stats) return null;
    
    const prevPeriod = activePeriod === "daily" ? "weekly" : activePeriod === "weekly" ? "monthly" : "daily";
    const prevData = stats[prevPeriod];
    
    return {
      views: calculateTrend(periodData.views, prevData.views),
      newUsers: calculateTrend(periodData.newUsers, prevData.newUsers),
      newTitles: calculateTrend(periodData.newTitles, prevData.newTitles),
      newChapters: calculateTrend(periodData.newChapters, prevData.newChapters),
    };
  }, [stats, periodData, activePeriod]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-2">
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
          value={formatNumber(stats.totalTitles)}
          label="Тайтлы"
          icon={<BookOpen className="w-5 h-5" />}
          color="blue"
          trend={trends ? { value: Math.round((stats.ongoingTitles / stats.totalTitles) * 100), isPositive: true } : undefined}
        />
        <StatCard
          value={formatNumber(stats.totalChapters)}
          label="Главы"
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          value={formatNumber(stats.totalUsers)}
          label="Пользователи"
          icon={<Users className="w-5 h-5" />}
          color="purple"
          trend={trends?.newUsers}
        />
        <StatCard
          value={formatNumber(stats.totalViews)}
          label="Просмотры"
          icon={<Eye className="w-5 h-5" />}
          color="orange"
          trend={trends?.views}
        />
        <StatCard
          value={formatNumber(stats.totalBookmarks)}
          label="Закладки"
          icon={<Bookmark className="w-5 h-5" />}
          color="pink"
        />
        <StatCard
          value={formatNumber(stats.totalCollections)}
          label="Коллекции"
          icon={<Layers className="w-5 h-5" />}
          color="cyan"
        />
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
          <PeriodStat 
            icon={Eye} 
            value={periodData.views} 
            label="Просмотры" 
            color="blue" 
            trend={trends?.views}
          />
          <PeriodStat 
            icon={Users} 
            value={periodData.newUsers} 
            label="Новые юзеры" 
            color="green" 
            trend={trends?.newUsers}
          />
          <PeriodStat
            icon={BookOpen}
            value={periodData.newTitles}
            label="Новые тайтлы"
            color="purple"
            trend={trends?.newTitles}
          />
          <PeriodStat
            icon={FileText}
            value={periodData.newChapters}
            label="Новые главы"
            color="orange"
            trend={trends?.newChapters}
          />
          <PeriodStat icon={Target} value={stats.averageRating} label="Ср. оценка" color="yellow" />
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

// Period Stat Component
function PeriodStat({
  icon: Icon,
  value,
  label,
  color,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
  trend?: { value: number; isPositive: boolean };
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
      {trend && (
        <div className={`flex items-center justify-center gap-1 text-xs mt-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}%
        </div>
      )}
    </div>
  );
}
