"use client";

import { UserProfile, BookmarkCategory } from "@/types/user";
import {
  BookOpen,
  Clock,
  HelpCircle,
  Coins,
  Bookmark,
  Zap,
  Crown,
  Flame,
  Calendar,
  PieChart,
  MessageCircle,
  Heart,
  CheckCircle2,
  Trophy,
  TrendingUp,
  Gift,
  Star,
  ShieldAlert,
} from "lucide-react";
import {
  getRankColor,
  getRankDisplay,
  getLevelProgress,
  levelToRank,
  RANK_NAMES,
} from "@/lib/rank-utils";
import { useState, useMemo } from "react";

interface ProfileStatsProps {
  userProfile: UserProfile;
  showDetailed?: boolean;
  /** Публичный просмотр (чужой профиль) */
  isPublicView?: boolean;
}

const CATEGORY_COLORS: Record<BookmarkCategory, string> = {
  reading: "#3b82f6",
  planned: "#8b5cf6",
  completed: "#22c55e",
  favorites: "#f59e0b",
  dropped: "#ef4444",
};

const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  reading: "Читаю",
  planned: "Планирую",
  completed: "Прочитано",
  favorites: "Избранное",
  dropped: "Брошено",
};

export default function ProfileStats({
  userProfile,
  showDetailed = true,
  isPublicView = false,
}: ProfileStatsProps) {
  const [showRankTooltip, setShowRankTooltip] = useState(false);
  const [showCoinsTooltip, setShowCoinsTooltip] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);

  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChaptersRead =
    userProfile.readingHistory?.reduce((total, item) => {
      return total + (item.chaptersCount ?? item.chapters?.length ?? 0);
    }, 0) || 0;
  const totalTitlesRead = userProfile.titlesReadCount ?? userProfile.readingHistory?.length ?? 0;

  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;

  // Новые данные из бэкенда
  const readingTimeMinutes = userProfile.readingTimeMinutes ?? totalChaptersRead * 4;
  const currentStreak = userProfile.currentStreak ?? 0;
  const longestStreak = userProfile.longestStreak ?? 0;
  const commentsCount = userProfile.commentsCount ?? 0;
  const likesReceivedCount = userProfile.likesReceivedCount ?? 0;
  const completedTitlesCount = userProfile.completedTitlesCount ?? 0;
  const ratingsCount = userProfile.ratingsCount ?? 0;
  const reportsCount = userProfile.reportsCount ?? 0;

  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);

  const bookmarksByCategory = useMemo(() => {
    const categories: Record<BookmarkCategory, number> = {
      reading: 0,
      planned: 0,
      completed: 0,
      favorites: 0,
      dropped: 0,
    };
    userProfile.bookmarks?.forEach(b => {
      if (b.category in categories) categories[b.category]++;
    });
    return categories;
  }, [userProfile.bookmarks]);

  // Если это публичный просмотр и пользователь скрыл статистику — не показываем
  const isStatsHidden = isPublicView && userProfile.showStats === false;

  if (isStatsHidden) {
    return (
      <div className="profile-glass-card rounded-xl border-dashed p-8 sm:p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]">
          <svg
            className="w-8 h-8 text-[var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">Статистика скрыта</p>
        <p className="text-xs text-[var(--muted-foreground)] max-w-xs mx-auto leading-relaxed">
          Пользователь ограничил доступ к своей статистике в настройках приватности.
        </p>
      </div>
    );
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} д ${hours} ч`;
  };

  const formatStreak = (days: number) => {
    if (days === 0) return "0 дней";
    if (days === 1) return "1 день";
    if (days < 5) return `${days} дня`;
    return `${days} дней`;
  };

  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const daysSinceJoined = joinedDate
    ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const avgChaptersPerDay =
    daysSinceJoined > 0 ? (totalChaptersRead / daysSinceJoined).toFixed(1) : "0";

  const stats = [
    {
      id: "streak",
      icon: Flame,
      label: "Серия дней",
      value: formatStreak(currentStreak),
      subValue: `Рекорд: ${formatStreak(longestStreak)}`,
    },
    {
      id: "time",
      icon: Clock,
      label: "Время чтения",
      value: formatReadingTime(readingTimeMinutes),
      subValue: `${totalTitlesRead} тайтлов`,
    },
    {
      id: "chapters",
      icon: BookOpen,
      label: "Глав прочитано",
      value: totalChaptersRead.toLocaleString(),
      subValue: `~${avgChaptersPerDay} в день`,
    },
    {
      id: "bookmarks",
      icon: Bookmark,
      label: "Закладки",
      value: totalBookmarks.toLocaleString(),
      subValue: `${bookmarksByCategory.reading} активных`,
    },
  ];

  return (
    <div className={showDetailed ? "space-y-5" : "space-y-3"}>
      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map(stat => (
          <div
            key={stat.id}
            className={`flex flex-col gap-1 profile-glass-card rounded-lg ${
              showDetailed ? "p-3.5 sm:p-4" : "p-3"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <stat.icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{stat.label}</span>
            </div>
            <p
              className={`font-semibold text-[var(--foreground)] tabular-nums leading-tight ${
                showDetailed ? "text-base sm:text-lg" : "text-sm sm:text-base"
              }`}
            >
              {stat.value}
            </p>
            {showDetailed && (
              <p className="text-[10px] text-[var(--muted-foreground)] leading-snug">{stat.subValue}</p>
            )}
          </div>
        ))}
      </div>

      {/* Level, Rank & Economy — компактный ряд при !showDetailed */}
      {!showDetailed ? (
        <div className="flex flex-wrap items-center gap-3 p-3 profile-glass-card rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: `${rankColor}20`, color: rankColor }}
            >
              {level}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: rankColor }}>
                {getRankDisplay(level)}
              </p>
              <div className="h-1.5 w-20 rounded-full bg-[var(--secondary)] overflow-hidden mt-0.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${expProgress}%`, backgroundColor: rankColor }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="tabular-nums">{experience.toLocaleString()} XP</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="tabular-nums">{balance.toLocaleString()}</span>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Level progress */}
        <div className="profile-glass-card sm:col-span-2 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{
                backgroundColor: `${rankColor}20`,
                color: rankColor,
                boxShadow: `0 0 16px ${rankColor}30`,
              }}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: rankColor }}>
                  {getRankDisplay(level)}
                </p>
                <div className="relative">
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    title="Подробнее о рангах"
                    onClick={() => setShowRankTooltip(!showRankTooltip)}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  {showRankTooltip && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowRankTooltip(false)}
                      />
                      <div className="absolute right-0 sm:right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-xs rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3 text-left shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            Ранги
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowRankTooltip(false)}
                            className="p-0.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </div>
                        <ul className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                          {RANK_NAMES.slice(1).map((rankName, idx) => {
                            const rank = idx + 1;
                            const minLevel = idx * 10;
                            const maxLevel = rank === 9 ? "90+" : rank * 10 - 1;
                            const isCurrentRank = rankInfo.rank === rank;
                            const color = getRankColor(rank);
                            return (
                              <li
                                key={rank}
                                className={`flex items-center justify-between gap-1 text-[10px] sm:text-[11px] py-1 px-1.5 rounded ${isCurrentRank ? "ring-1 ring-inset" : ""}`}
                                style={
                                  isCurrentRank
                                    ? ({
                                        backgroundColor: `${color}15`,
                                        "--tw-ring-color": `${color}40`,
                                      } as React.CSSProperties)
                                    : undefined
                                }
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0"
                                    style={{ backgroundColor: `${color}20`, color }}
                                  >
                                    {rank}
                                  </span>
                                  <span
                                    className="font-medium truncate"
                                    style={{ color: isCurrentRank ? color : "var(--foreground)" }}
                                  >
                                    {rankName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {isCurrentRank && (
                                    <span
                                      className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-medium"
                                      style={{ backgroundColor: `${color}25`, color }}
                                    >
                                      ВЫ
                                    </span>
                                  )}
                                  <span className="text-[var(--muted-foreground)] text-[9px] sm:text-[10px]">
                                    {minLevel}-{maxLevel}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${expProgress}%`,
                  backgroundColor: rankColor,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {experience.toLocaleString()} XP
              </span>
              <span>
                {(nextLevelExp - experience).toLocaleString()} XP до ур. {level + 1}
              </span>
            </div>
          </div>
        </div>

        {/* XP card */}
        <div className="profile-glass-card relative rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
              <span className="text-xs text-[var(--muted-foreground)]">Всего опыта</span>
            </div>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setShowExpTooltip(!showExpTooltip)}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-bold text-amber-500 tabular-nums">
            {experience.toLocaleString()}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
            {expProgress.toFixed(0)}% до уровня {level + 1}
          </p>

          {showExpTooltip && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExpTooltip(false)} />
              <div className="absolute left-0 sm:right-0 sm:left-auto top-full z-50 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-xs rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3 text-left shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Как получить XP
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowExpTooltip(false)}
                    className="p-0.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
                <ul className="space-y-1">
                  {[
                    { action: "Чтение новой главы", xp: "+10" },
                    { action: "Ежедневный вход", xp: "+5" },
                    { action: "Серия 7 дней", xp: "+50" },
                    { action: "Серия 14 дней", xp: "+100" },
                    { action: "Серия 21 день", xp: "+150" },
                    { action: "Серия 30 дней", xp: "+250" },
                    { action: "Достижение (обычное)", xp: "+10" },
                    { action: "Достижение (редкое)", xp: "+50" },
                    { action: "Достижение (эпическое)", xp: "+100" },
                    { action: "Достижение (легенд.)", xp: "+250" },
                  ].map(item => (
                    <li
                      key={item.action}
                      className="flex items-center justify-between text-[10px] sm:text-[11px] py-1 px-1.5 rounded bg-[var(--secondary)]/30"
                    >
                      <span className="text-[var(--foreground)]">{item.action}</span>
                      <span className="text-amber-500 font-bold">{item.xp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Balance card */}
        <div className="profile-glass-card relative rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
              <span className="text-xs text-[var(--muted-foreground)]">Монеты</span>
            </div>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setShowCoinsTooltip(!showCoinsTooltip)}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-2xl font-bold text-yellow-500 tabular-nums">
            {balance.toLocaleString()}
          </p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Для магазина</p>

          {showCoinsTooltip && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCoinsTooltip(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-xs rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 sm:p-3 text-left shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" />
                    Как получить
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCoinsTooltip(false)}
                    className="p-0.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                  >
                    <span className="text-xs">✕</span>
                  </button>
                </div>
                <ul className="space-y-1">
                  {[
                    { action: "Повышение уровня", coins: "+10" },
                    { action: "Ежедневный бонус", coins: "+1-5" },
                    { action: "Активность в серии", coins: "+5" },
                  ].map(item => (
                    <li
                      key={item.action}
                      className="flex items-center justify-between text-[10px] sm:text-[11px] py-1 px-1.5 rounded bg-[var(--secondary)]/30"
                    >
                      <span className="text-[var(--foreground)]">{item.action}</span>
                      <span className="text-yellow-500 font-bold">{item.coins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Bookmarks breakdown */}
      {showDetailed && totalBookmarks > 0 && (
        <div className="profile-glass-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" aria-hidden />
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Закладки по категориям</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Доля от общего числа</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(bookmarksByCategory) as BookmarkCategory[]).map(category => {
              const count = bookmarksByCategory[category];
              const percent = totalBookmarks > 0 ? Math.round((count / totalBookmarks) * 100) : 0;
              return (
                <div
                  key={category}
                  className="text-center p-2.5 rounded-md border border-[var(--border)]/60 bg-[var(--muted)]/5"
                >
                  <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{count}</p>
                  <p className="text-[11px] text-[var(--foreground)] mt-0.5">{CATEGORY_LABELS[category]}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{percent}%</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 rounded-full bg-[var(--secondary)] overflow-hidden flex">
            {(Object.keys(bookmarksByCategory) as BookmarkCategory[]).map(category => {
              const count = bookmarksByCategory[category];
              const percent = totalBookmarks > 0 ? (count / totalBookmarks) * 100 : 0;
              return (
                <div
                  key={category}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: CATEGORY_COLORS[category],
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Activity & Social stats */}
      {showDetailed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[
            {
              icon: Calendar,
              label: "Дней на сайте",
              value: daysSinceJoined.toLocaleString(),
              color: "text-blue-500",
            },
            {
              icon: MessageCircle,
              label: "Комментариев",
              value: commentsCount.toLocaleString(),
              color: "text-cyan-500",
            },
            {
              icon: Heart,
              label: "Лайков",
              value: likesReceivedCount.toLocaleString(),
              color: "text-pink-500",
            },
            {
              icon: CheckCircle2,
              label: "Завершено тайтлов",
              value: completedTitlesCount.toLocaleString(),
              color: "text-green-500",
            },
            {
              icon: Star,
              label: "Оценок",
              value: ratingsCount.toLocaleString(),
              color: "text-amber-500",
            },
            {
              icon: ShieldAlert,
              label: "Жалоб",
              value: reportsCount.toLocaleString(),
              color: "text-slate-500",
            },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 p-3 profile-glass-card rounded-lg"
            >
              <item.icon className={`w-4 h-4 ${item.color} shrink-0`} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] tabular-nums leading-tight">
                  {item.value}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to earn XP & Coins */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0 items-stretch">
          {/* How to earn XP */}
          <div className="profile-glass-card flex flex-col rounded-lg p-4 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Как получить опыт</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Начисление XP</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 min-w-0 flex-1 content-start">
              {[
                {
                  action: "Чтение новой главы",
                  xp: "+10 XP",
                  icon: BookOpen,
                  color: "text-blue-500",
                },
                { action: "Ежедневный вход", xp: "+5 XP", icon: Calendar, color: "text-green-500" },
                { action: "Серия 7 дней", xp: "+50 XP", icon: Flame, color: "text-orange-500" },
                { action: "Серия 14 дней", xp: "+100 XP", icon: Flame, color: "text-orange-500" },
                { action: "Серия 21 день", xp: "+150 XP", icon: Flame, color: "text-red-500" },
                { action: "Серия 30 дней", xp: "+250 XP", icon: Flame, color: "text-red-500" },
                {
                  action: "Достижение (обычное)",
                  xp: "+10 XP",
                  icon: Trophy,
                  color: "text-slate-500",
                },
                {
                  action: "Достижение (редкое)",
                  xp: "+50 XP",
                  icon: Trophy,
                  color: "text-blue-500",
                },
                {
                  action: "Достижение (эпическое)",
                  xp: "+100 XP",
                  icon: Trophy,
                  color: "text-purple-500",
                },
                {
                  action: "Достижение (легендарное)",
                  xp: "+250 XP",
                  icon: Trophy,
                  color: "text-amber-500",
                },
              ].map(item => (
                <div
                  key={item.action}
                  className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-md border border-[var(--border)]/50 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span
                      className="text-xs text-[var(--foreground)] min-w-0 truncate"
                      title={item.action}
                    >
                      {item.action}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-500 shrink-0 tabular-nums">
                    {item.xp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How to earn Coins */}
          <div className="profile-glass-card flex flex-col rounded-lg p-4 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Как получить монеты</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Валюта магазина</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5 min-w-0 flex-1 content-start">
              {[
                {
                  action: "Повышение уровня",
                  coins: "+10",
                  icon: TrendingUp,
                  color: "text-green-500",
                },
                { action: "Ежедневный бонус", coins: "+1-5", icon: Gift, color: "text-pink-500" },
                { action: "Серия 7 дней", coins: "+5", icon: Flame, color: "text-orange-500" },
                { action: "Серия 14 дней", coins: "+10", icon: Flame, color: "text-orange-500" },
                { action: "Серия 21 день", coins: "+15", icon: Flame, color: "text-red-500" },
                { action: "Серия 30 дней", coins: "+25", icon: Flame, color: "text-red-500" },
              ].map(item => (
                <div
                  key={item.action}
                  className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-md border border-[var(--border)]/50 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span
                      className="text-xs text-[var(--foreground)] min-w-0 truncate"
                      title={item.action}
                    >
                      {item.action}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-yellow-500 shrink-0 tabular-nums">
                    {item.coins}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
