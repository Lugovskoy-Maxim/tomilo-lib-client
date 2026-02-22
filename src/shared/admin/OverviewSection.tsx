import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Megaphone,
  MessageCircleWarning,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetStatsQuery } from "@/store/api/statsApi";
import { useSearchTitlesQuery } from "@/store/api/titlesApi";
import { useSearchChaptersQuery } from "@/store/api/chaptersApi";
import { useGetReportsQuery } from "@/store/api/reportsApi";
import { formatNumber } from "@/lib/utils";

type AdminTab = "overview" | "parser" | "titles" | "chapters" | "work-queue" | "reports" | "announcements";

interface OverviewSectionProps {
  onTabChange: (tab: AdminTab) => void;
}

function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } {
  if (!previous) return { value: 0, isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change * 10) / 10),
    isPositive: change >= 0,
  };
}

export function OverviewSection({ onTabChange }: OverviewSectionProps) {
  const [activePeriod, setActivePeriod] = useState<"daily" | "weekly" | "monthly">("weekly");

  const { data: statsData, isLoading, error } = useGetStatsQuery();
  const { data: titlesHealthData } = useSearchTitlesQuery({
    page: 1,
    limit: 200,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const { data: chaptersHealthData } = useSearchChaptersQuery({
    page: 1,
    limit: 200,
    sortOrder: "desc",
  });
  const { data: unresolvedReports } = useGetReportsQuery({
    page: 1,
    limit: 1,
    isResolved: "false",
  });

  const stats = statsData?.data;

  const periodData = useMemo(
    () =>
      stats?.[activePeriod] || {
        views: 0,
        newUsers: 0,
        newTitles: 0,
        newChapters: 0,
        chaptersRead: 0,
      },
    [stats, activePeriod],
  );

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
  }, [activePeriod, periodData, stats]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-pulse" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/5 p-6 text-center">
        <p className="font-semibold text-[var(--destructive)]">Ошибка загрузки обзора</p>
        <p className="mt-1 text-sm text-[var(--destructive)]/80">Проверьте соединение и попробуйте снова</p>
      </div>
    );
  }

  const titlesWithoutChaptersCount = (titlesHealthData?.data?.data || []).filter(
    title => (title.totalChapters || 0) === 0,
  ).length;
  const chaptersWithoutPagesCount = (chaptersHealthData?.chapters || []).filter(
    chapter => (chapter.pages?.length ?? chapter.images?.length ?? 0) === 0,
  ).length;
  const unresolvedReportsCount = unresolvedReports?.data?.total || 0;

  const popularTitles = Array.isArray(stats.popularTitles) ? stats.popularTitles : [];
  const popularChapters = Array.isArray(stats.popularChapters) ? stats.popularChapters : [];
  const blockersTotal = titlesWithoutChaptersCount + chaptersWithoutPagesCount + unresolvedReportsCount;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card)] to-[var(--secondary)]/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Операционная сводка</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Что происходит на платформе и что нужно сделать в первую очередь
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/70 px-3 py-2 text-sm">
            <span className="text-[var(--muted-foreground)]">Критичных задач:</span>{" "}
            <span className="font-semibold text-[var(--foreground)]">{blockersTotal}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewMetricCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Тайтлы"
          value={formatNumber(stats.totalTitles)}
          note={`${formatNumber(stats.ongoingTitles || 0)} онгоингов`}
        />
        <OverviewMetricCard
          icon={<FileText className="w-5 h-5" />}
          label="Главы"
          value={formatNumber(stats.totalChapters)}
          note={`${formatNumber(stats.monthly?.newChapters || 0)} за месяц`}
        />
        <OverviewMetricCard
          icon={<Users className="w-5 h-5" />}
          label="Пользователи"
          value={formatNumber(stats.totalUsers)}
          note={`${formatNumber(stats.daily?.newUsers || 0)} новых сегодня`}
        />
        <OverviewMetricCard
          icon={<Eye className="w-5 h-5" />}
          label="Просмотры"
          value={formatNumber(stats.totalViews)}
          note={`${formatNumber(stats.daily?.views || 0)} за сегодня`}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Что требует внимания</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Приоритетные задачи, которые напрямую влияют на качество контента
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <ActionCard
            title="Новые жалобы"
            description="Проверьте обращения пользователей и закройте валидные кейсы"
            value={unresolvedReportsCount}
            tone="danger"
            icon={<MessageCircleWarning className="w-4 h-4" />}
            buttonLabel="Открыть жалобы"
            onClick={() => onTabChange("reports")}
          />
          <ActionCard
            title="Тайтлы без глав"
            description="Карточки созданы, но контент еще не добавлен"
            value={titlesWithoutChaptersCount}
            tone="warning"
            icon={<ClipboardList className="w-4 h-4" />}
            buttonLabel="Открыть очередь"
            onClick={() => onTabChange("work-queue")}
          />
          <ActionCard
            title="Главы без страниц"
            description="Читатель не сможет открыть контент без изображений"
            value={chaptersWithoutPagesCount}
            tone="danger"
            icon={<AlertTriangle className="w-4 h-4" />}
            buttonLabel="Исправить"
            onClick={() => onTabChange("work-queue")}
          />
          <ActionCard
            title="Новости и объявления"
            description="Публикуйте новости на главной и управляйте объявлениями"
            value={0}
            tone="warning"
            icon={<Megaphone className="w-4 h-4" />}
            buttonLabel="Создать новость"
            onClick={() => onTabChange("announcements")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--secondary)]/20 p-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Динамика по периоду</h3>
          <div className="mt-3 flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map(period => (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activePeriod === period
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                {period === "daily" ? "Сегодня" : period === "weekly" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <PeriodKpi
            label="Просмотры"
            value={periodData.views}
            trend={trends?.views}
            icon={<Eye className="w-4 h-4" />}
          />
          <PeriodKpi
            label="Новые пользователи"
            value={periodData.newUsers}
            trend={trends?.newUsers}
            icon={<Users className="w-4 h-4" />}
          />
          <PeriodKpi
            label="Новые тайтлы"
            value={periodData.newTitles}
            trend={trends?.newTitles}
            icon={<BookOpen className="w-4 h-4" />}
          />
          <PeriodKpi
            label="Новые главы"
            value={periodData.newChapters}
            trend={trends?.newChapters}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--secondary)]/20 px-4 py-3">
            <h3 className="font-semibold text-[var(--foreground)]">Лидеры по просмотрам</h3>
            <button onClick={() => onTabChange("titles")} className="text-sm text-[var(--primary)] hover:underline">
              К тайтлам
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {popularTitles.slice(0, 6).map((title, index) => (
              <div key={title.id} className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{title.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatNumber(title.dayViews || 0)} сегодня
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {formatNumber(title.views || 0)}
                </p>
              </div>
            ))}
            {popularTitles.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Нет данных</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--secondary)]/20 px-4 py-3">
            <h3 className="font-semibold text-[var(--foreground)]">Лидеры по главам</h3>
            <button onClick={() => onTabChange("chapters")} className="text-sm text-[var(--primary)] hover:underline">
              К главам
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {popularChapters.slice(0, 6).map((chapter, index) => (
              <div key={chapter.id} className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {chapter.name || `Глава ${chapter.chapterNumber}`}
                  </p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {chapter.titleName || "Тайтл не указан"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {formatNumber(chapter.views || 0)}
                </p>
              </div>
            ))}
            {popularChapters.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">Нет данных</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold text-[var(--foreground)]">Быстрые действия</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon={<Target className="w-4 h-4" />} label="Создать тайтл" onClick={() => onTabChange("titles")} />
          <QuickAction icon={<FileText className="w-4 h-4" />} label="Проверить главы" onClick={() => onTabChange("chapters")} />
          <QuickAction icon={<Download className="w-4 h-4" />} label="Запустить парсер" onClick={() => onTabChange("parser")} />
          <QuickAction icon={<ClipboardList className="w-4 h-4" />} label="Открыть очередь" onClick={() => onTabChange("work-queue")} />
        </div>
      </section>
    </div>
  );
}

function OverviewMetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <span>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{note}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  value,
  buttonLabel,
  onClick,
  tone,
  icon,
}: {
  title: string;
  description: string;
  value: number;
  buttonLabel: string;
  onClick: () => void;
  tone: "warning" | "danger";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "danger"
      ? "border-[var(--destructive)]/30 bg-[var(--destructive)]/5"
      : "border-amber-500/30 bg-amber-500/10";

  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <span className="text-[var(--muted-foreground)]">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      <button
        onClick={onClick}
        className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)]"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function PeriodKpi({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: number;
  trend?: { value: number; isPositive: boolean } | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 p-4">
      <div className="flex items-center justify-between text-[var(--muted-foreground)]">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-[var(--foreground)]">{formatNumber(value)}</p>
      {trend && (
        <div
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            trend.isPositive
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--destructive)]/15 text-[var(--destructive)]"
          }`}
        >
          {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend.value}%
        </div>
      )}
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
    >
      <span className="text-[var(--primary)]">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
