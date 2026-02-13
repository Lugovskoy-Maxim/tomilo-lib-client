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
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--accent)]/40 transition-colors">
      <span className="w-8 h-8 rounded-xl bg-[var(--chart-5)]/15 flex items-center justify-center text-sm font-bold text-[var(--chart-5)] shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{chapter.name}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate" title={displayTitleName}>
          {displayTitleName}
        </p>
      </div>
      <span className="text-sm font-semibold text-[var(--primary)] shrink-0">
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
      <div className="space-y-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] h-20 animate-pulse" />
        <div>
          <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
                <div className="h-8 w-16 bg-[var(--muted)] rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-20 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] h-48 animate-pulse" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-6 text-center">
        <p className="font-semibold text-[var(--destructive)]">Ошибка загрузки статистики</p>
        <p className="text-sm text-[var(--destructive)]/80 mt-1">Не удалось получить данные с сервера</p>
      </div>
    );
  }

  const quickActions = [
    { icon: Plus, label: "Создать тайтл", action: () => onTabChange("titles"), color: "blue" },
    { icon: Download, label: "Парсинг", action: () => onTabChange("parser"), color: "green" },
    { icon: BookOpen, label: "Тайтлы", action: () => onTabChange("titles"), color: "purple" },
    { icon: FileText, label: "Главы", action: () => onTabChange("chapters"), color: "orange" },
  ];

  const popularTitles = Array.isArray(stats.popularTitles) ? stats.popularTitles : [];
  const popularChapters = Array.isArray(stats.popularChapters) ? stats.popularChapters : [];
  const ongoingShare = stats.totalTitles ? Math.round(((stats.ongoingTitles ?? 0) / stats.totalTitles) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Заголовок секции */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/30 px-5 py-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Сводка по платформе</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Ключевые метрики и быстрые действия для управления контентом
        </p>
      </div>

      {/* Основные метрики */}
      <div>
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 uppercase tracking-wider">Основные показатели</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            value={formatNumber(stats.totalTitles)}
            label="Тайтлы"
            icon={<BookOpen className="w-5 h-5" />}
            color="blue"
            trend={trends && stats.totalTitles ? { value: ongoingShare, isPositive: true } : undefined}
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
      </div>

      {/* Период: вкладки + метрики */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
        <div className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--secondary)]/20">
          {(["daily", "weekly", "monthly"] as const).map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activePeriod === period
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              {period === "daily" ? "Сегодня" : period === "weekly" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 p-6">
          <PeriodStat icon={Eye} value={periodData.views} label="Просмотры" color="blue" trend={trends?.views} />
          <PeriodStat icon={Users} value={periodData.newUsers} label="Новые пользователи" color="green" trend={trends?.newUsers} />
          <PeriodStat icon={BookOpen} value={periodData.newTitles} label="Новые тайтлы" color="purple" trend={trends?.newTitles} />
          <PeriodStat icon={FileText} value={periodData.newChapters} label="Новые главы" color="orange" trend={trends?.newChapters} />
          <PeriodStat icon={Target} value={typeof stats.averageRating === "number" ? stats.averageRating : 0} label="Ср. оценка" color="yellow" />
        </div>
      </div>

      {/* Две колонки: популярные тайтлы + действия и топ глав */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Популярные тайтлы */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--secondary)]/20">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--chart-1)]/15 text-[var(--chart-1)]">
                <TrendingUp className="w-5 h-5" />
              </span>
              Популярные тайтлы
            </h3>
            <button
              onClick={() => onTabChange("titles")}
              className="text-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              Все <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {popularTitles.slice(0, 8).map((title, index) => (
              <div
                key={title.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--accent)]/40 transition-colors"
              >
                <span className="w-8 h-8 rounded-xl bg-[var(--chart-1)]/15 text-[var(--chart-1)] flex items-center justify-center text-sm font-bold shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">{title.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {formatNumber(title.views ?? 0)} просмотров
                    {typeof title.dayViews === "number" && (
                      <span className="ml-2 text-[var(--primary)]">· {formatNumber(title.dayViews)} сегодня</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-[var(--muted-foreground)]">{formatNumber(title.weekViews ?? 0)} за неделю</p>
                </div>
              </div>
            ))}
            {popularTitles.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[var(--muted-foreground)]">Нет данных за выбранный период</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Быстрые действия */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Target className="w-4 h-4" />
              </span>
              Быстрые действия
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 p-4 hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all"
                >
                  <action.icon className="w-6 h-6 text-[var(--primary)]" />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Топ глав */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--secondary)]/20">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--chart-5)]/15 text-[var(--chart-5)]">
                  <Award className="w-5 h-5" />
                </span>
                Топ глав
              </h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {popularChapters.slice(0, 5).map((chapter, index) => (
                <PopularChapterItem key={chapter.id} chapter={chapter} index={index} />
              ))}
              {popularChapters.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-[var(--muted-foreground)]">Нет данных</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Блоки: Активность, Статус тайтлов, Сессия */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-xl bg-[var(--chart-1)]/15 text-[var(--chart-1)]">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-[var(--foreground)]">Активность</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Онлайн сегодня</dt>
              <dd className="font-semibold">{stats.activeUsersToday ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Рейтингов</dt>
              <dd className="font-semibold">{stats.totalRatings ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Ср. оценка</dt>
              <dd className="font-semibold">{typeof stats.averageRating === "number" ? stats.averageRating.toFixed(2) : "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-xl bg-[var(--chart-2)]/15 text-[var(--chart-2)]">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-[var(--foreground)]">Статус тайтлов</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Онгоинг</dt>
              <dd className="font-semibold text-[var(--chart-2)]">{stats.ongoingTitles ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Завершённые</dt>
              <dd className="font-semibold text-[var(--chart-1)]">{stats.completedTitles ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Всего</dt>
              <dd className="font-semibold">{stats.totalTitles}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-xl bg-[var(--chart-4)]/15 text-[var(--chart-4)]">
              <Clock className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-[var(--foreground)]">Пользователи и главы</h3>
          </div>
          <dl className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Новые за месяц</dt>
              <dd className="font-semibold">{stats.newUsersThisMonth ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Новые сегодня</dt>
              <dd className="font-semibold">{stats.daily?.newUsers ?? 0}</dd>
            </div>
            <div className="flex justify-between items-center text-sm">
              <dt className="text-[var(--muted-foreground)]">Глав за месяц</dt>
              <dd className="font-semibold">{formatNumber(stats.monthly?.newChapters ?? 0)}</dd>
            </div>
          </dl>
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
    blue: "text-[var(--chart-1)] bg-[var(--chart-1)]/10",
    green: "text-[var(--chart-2)] bg-[var(--chart-2)]/10",
    purple: "text-[var(--chart-3)] bg-[var(--chart-3)]/10",
    orange: "text-[var(--chart-4)] bg-[var(--chart-4)]/10",
    yellow: "text-[var(--chart-5)] bg-[var(--chart-5)]/10",
  };
  const cls = colorClasses[color] || colorClasses.blue;

  const formatValue = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="text-center">
      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${cls}`}>
        <Icon className="w-5 h-5" />
      </span>
      <p className="text-xl font-bold text-[var(--foreground)]">{formatValue(value)}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
      {trend && (
        <div className={`flex items-center justify-center gap-1 text-xs mt-2 font-medium ${trend.isPositive ? "text-[var(--chart-2)]" : "text-[var(--destructive)]"}`}>
          {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend.value}%
        </div>
      )}
    </div>
  );
}
