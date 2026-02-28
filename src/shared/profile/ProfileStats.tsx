"use client";

import { UserProfile, BookmarkCategory } from "@/types/user";
import { 
  BookOpen, Clock, HelpCircle, Coins, Bookmark, Zap, Crown,
  Flame, Calendar, PieChart, MessageCircle, Heart, CheckCircle2, Trophy, TrendingUp, Gift
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

export default function ProfileStats({ userProfile, showDetailed = true }: ProfileStatsProps) {
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);
  const [showRankTooltip, setShowRankTooltip] = useState(false);
  const [showCoinsTooltip, setShowCoinsTooltip] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);

  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChaptersRead = userProfile.readingHistory?.reduce((total, item) => {
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

  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);

  const bookmarksByCategory = useMemo(() => {
    const categories: Record<BookmarkCategory, number> = {
      reading: 0, planned: 0, completed: 0, favorites: 0, dropped: 0
    };
    userProfile.bookmarks?.forEach(b => {
      if (b.category in categories) categories[b.category]++;
    });
    return categories;
  }, [userProfile.bookmarks]);

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
  const daysSinceJoined = joinedDate ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const avgChaptersPerDay = daysSinceJoined > 0 ? (totalChaptersRead / daysSinceJoined).toFixed(1) : "0";

  const stats = [
    {
      id: "streak",
      icon: Flame,
      label: "Серия дней",
      value: formatStreak(currentStreak),
      subValue: `Рекорд: ${formatStreak(longestStreak)}`,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
    },
    {
      id: "time",
      icon: Clock,
      label: "Время чтения",
      value: formatReadingTime(readingTimeMinutes),
      subValue: `${totalTitlesRead} тайтлов`,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "chapters",
      icon: BookOpen,
      label: "Глав прочитано",
      value: totalChaptersRead.toLocaleString(),
      subValue: `~${avgChaptersPerDay} в день`,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "bookmarks",
      icon: Bookmark,
      label: "Закладки",
      value: totalBookmarks.toLocaleString(),
      subValue: `${bookmarksByCategory.reading} активных`,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`group relative flex flex-col gap-2 rounded-xl p-4 bg-[var(--secondary)]/40 border border-[var(--border)]/60 hover:border-[var(--border)] hover:bg-[var(--secondary)]/60 transition-all duration-300 cursor-pointer overflow-hidden ${
              activeStatCard === stat.id ? "ring-2 ring-[var(--primary)]/50" : ""
            }`}
            onMouseEnter={() => setActiveStatCard(stat.id)}
            onMouseLeave={() => setActiveStatCard(null)}
          >
            <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <stat.icon className="w-full h-full" />
            </div>
            
            <div className={`w-fit p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            
            <div>
              <div className="text-lg sm:text-xl font-bold text-[var(--foreground)] tabular-nums leading-tight">
                {stat.value}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {stat.label}
              </div>
            </div>
            
            {showDetailed && (
              <div className="text-[10px] text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {stat.subValue}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Level, Rank & Economy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Level progress */}
        <div className="sm:col-span-2 relative rounded-xl p-4 bg-gradient-to-br from-[var(--secondary)]/50 to-[var(--secondary)]/30 border border-[var(--border)]/60">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ 
                backgroundColor: `${rankColor}20`,
                color: rankColor,
                boxShadow: `0 0 16px ${rankColor}30`
              }}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: rankColor }}>{getRankDisplay(level)}</p>
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
                                className={`flex items-center justify-between gap-1 text-[10px] sm:text-[11px] py-1 px-1.5 rounded ${isCurrentRank ? 'ring-1 ring-inset' : ''}`}
                                style={isCurrentRank ? { 
                                  backgroundColor: `${color}15`,
                                  '--tw-ring-color': `${color}40`
                                } as React.CSSProperties : undefined}
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
                                    style={{ color: isCurrentRank ? color : 'var(--foreground)' }}
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
                className="h-full rounded-full transition-all duration-700 ease-out relative"
                style={{ 
                  width: `${expProgress}%`,
                  background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}cc 100%)`,
                  boxShadow: `0 0 8px ${rankColor}50`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {experience.toLocaleString()} XP
              </span>
              <span>{(nextLevelExp - experience).toLocaleString()} XP до ур. {level + 1}</span>
            </div>
          </div>
        </div>

        {/* XP card */}
        <div className="relative rounded-xl p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
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
          <p className="text-2xl font-bold text-amber-500 tabular-nums">{experience.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{expProgress.toFixed(0)}% до уровня {level + 1}</p>
          
          {showExpTooltip && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExpTooltip(false)}
              />
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
                  ].map((item) => (
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
        <div className="relative rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-yellow-500/20">
                <Coins className="w-4 h-4 text-yellow-500" />
              </div>
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
          <p className="text-2xl font-bold text-yellow-500 tabular-nums">{balance.toLocaleString()}</p>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Для магазина</p>
          
          {showCoinsTooltip && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowCoinsTooltip(false)}
              />
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
                  ].map((item) => (
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

      {/* Bookmarks breakdown */}
      {showDetailed && totalBookmarks > 0 && (
        <div className="rounded-xl p-5 bg-[var(--secondary)]/30 border border-[var(--border)]/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--chart-2)]/20">
              <PieChart className="w-5 h-5 text-[var(--chart-2)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Распределение закладок</h3>
              <p className="text-xs text-[var(--muted-foreground)]">По категориям</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.keys(bookmarksByCategory) as BookmarkCategory[]).map((category) => {
              const count = bookmarksByCategory[category];
              const percent = totalBookmarks > 0 ? Math.round((count / totalBookmarks) * 100) : 0;
              return (
                <div key={category} className="text-center p-3 rounded-lg bg-[var(--card)]/50 border border-[var(--border)]/40">
                  <div 
                    className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }}
                  >
                    {count}
                  </div>
                  <p className="text-xs font-medium text-[var(--foreground)]">{CATEGORY_LABELS[category]}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{percent}%</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2 rounded-full bg-[var(--secondary)] overflow-hidden flex">
            {(Object.keys(bookmarksByCategory) as BookmarkCategory[]).map((category) => {
              const count = bookmarksByCategory[category];
              const percent = totalBookmarks > 0 ? (count / totalBookmarks) * 100 : 0;
              return (
                <div
                  key={category}
                  className="h-full transition-all duration-500"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: CATEGORY_COLORS[category]
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Activity & Social stats */}
      {showDetailed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Дней на сайте", value: daysSinceJoined.toLocaleString(), color: "text-blue-500" },
            { icon: MessageCircle, label: "Комментариев", value: commentsCount.toLocaleString(), color: "text-cyan-500" },
            { icon: Heart, label: "Получено лайков", value: likesReceivedCount.toLocaleString(), color: "text-pink-500" },
            { icon: CheckCircle2, label: "Завершено тайтлов", value: completedTitlesCount.toLocaleString(), color: "text-green-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]/30 border border-[var(--border)]/50">
              <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">{item.value}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to earn XP & Coins */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* How to earn XP */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Как получить опыт</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Способы повышения уровня</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { action: "Чтение новой главы", xp: "+10 XP", icon: BookOpen, color: "text-blue-500" },
                { action: "Ежедневный вход", xp: "+5 XP", icon: Calendar, color: "text-green-500" },
                { action: "Серия 7 дней", xp: "+50 XP", icon: Flame, color: "text-orange-500" },
                { action: "Серия 14 дней", xp: "+100 XP", icon: Flame, color: "text-orange-500" },
                { action: "Серия 21 день", xp: "+150 XP", icon: Flame, color: "text-red-500" },
                { action: "Серия 30 дней", xp: "+250 XP", icon: Flame, color: "text-red-500" },
                { action: "Достижение (обычное)", xp: "+10 XP", icon: Trophy, color: "text-slate-500" },
                { action: "Достижение (редкое)", xp: "+50 XP", icon: Trophy, color: "text-blue-500" },
                { action: "Достижение (эпическое)", xp: "+100 XP", icon: Trophy, color: "text-purple-500" },
                { action: "Достижение (легендарное)", xp: "+250 XP", icon: Trophy, color: "text-amber-500" },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--card)]/60 border border-[var(--border)]/30">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs text-[var(--foreground)]">{item.action}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-500">{item.xp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How to earn Coins */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Coins className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Как получить монеты</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Валюта для магазина</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {[
                { action: "Повышение уровня", coins: "+10", icon: TrendingUp, color: "text-green-500" },
                { action: "Ежедневный бонус", coins: "+1-5", icon: Gift, color: "text-pink-500" },
                { action: "Серия 7 дней", coins: "+5", icon: Flame, color: "text-orange-500" },
                { action: "Серия 14 дней", coins: "+10", icon: Flame, color: "text-orange-500" },
                { action: "Серия 21 день", coins: "+15", icon: Flame, color: "text-red-500" },
                { action: "Серия 30 дней", coins: "+25", icon: Flame, color: "text-red-500" },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--card)]/60 border border-[var(--border)]/30">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs text-[var(--foreground)]">{item.action}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-500">{item.coins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
