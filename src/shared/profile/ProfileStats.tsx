"use client";

import { UserProfile, BookmarkCategory } from "@/types/user";
import { 
  BookOpen, Clock, HelpCircle, Coins, TrendingUp, Bookmark, Zap,
  Crown, Flame, Target, Calendar, BarChart3, PieChart, Activity
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStatCard, setActiveStatCard] = useState<string | null>(null);

  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChaptersRead = userProfile.readingHistory?.reduce((total, item) => {
    return total + (item.chaptersCount ?? item.chapters?.length ?? 0);
  }, 0) || 0;
  const totalTitlesRead = userProfile.readingHistory?.length || 0;

  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;

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

  const formatReadingTime = (chapters: number) => {
    const minutes = chapters * 2;
    if (minutes < 60) return `${minutes} мин`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days} д ${hours} ч`;
  };

  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const daysSinceJoined = joinedDate ? Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const avgChaptersPerDay = daysSinceJoined > 0 ? (totalChaptersRead / daysSinceJoined).toFixed(1) : "0";

  const stats = [
    {
      id: "exp",
      icon: Zap,
      label: "Опыт",
      value: experience.toLocaleString(),
      subValue: `+${Math.round(experience * 0.1).toLocaleString()} за неделю`,
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      id: "balance",
      icon: Coins,
      label: "Монеты",
      value: balance.toLocaleString(),
      subValue: "Потратить в магазине",
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-500/10",
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
      id: "time",
      icon: Clock,
      label: "Время чтения",
      value: formatReadingTime(totalChaptersRead),
      subValue: `${totalTitlesRead} тайтлов`,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* Level progress + Rank section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Level progress */}
        <div className="lg:col-span-2 relative rounded-xl p-5 bg-gradient-to-br from-[var(--secondary)]/50 to-[var(--secondary)]/30 border border-[var(--border)]/60 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transform translate-x-8 -translate-y-8">
            <TrendingUp className="w-full h-full" />
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--primary)]/20">
                <Activity className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Прогресс уровня</h3>
                <p className="text-xs text-[var(--muted-foreground)]">До следующего уровня</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--foreground)]">{level}</p>
              <p className="text-xs text-[var(--muted-foreground)]">уровень</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 rounded-full bg-[var(--secondary)] overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out relative"
                style={{ 
                  width: `${expProgress}%`,
                  background: `linear-gradient(90deg, var(--primary) 0%, var(--chart-1) 100%)`,
                  boxShadow: `0 0 12px var(--primary)`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                {experience.toLocaleString()} XP
              </span>
              <span>{nextLevelExp.toLocaleString()} XP нужно</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)]/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Target className="w-3.5 h-3.5" />
              <span>Осталось <strong className="text-[var(--foreground)]">{(nextLevelExp - experience).toLocaleString()}</strong> XP</span>
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {expProgress.toFixed(1)}% пройдено
            </div>
          </div>
        </div>

        {/* Rank card */}
        <div 
          className="relative rounded-xl p-5 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${rankColor}15 0%, ${rankColor}05 100%)`,
            border: `1px solid ${rankColor}30`,
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none">
            <Crown className="w-full h-full" style={{ color: rankColor }} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg"
                style={{ 
                  backgroundColor: `${rankColor}25`,
                  color: rankColor,
                  boxShadow: `0 4px 20px ${rankColor}30`
                }}
              >
                {rankInfo.rank}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Текущий ранг</p>
                <p className="font-bold" style={{ color: rankColor }}>
                  {getRankDisplay(level)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              onClick={() => setIsModalOpen(true)}
              title="Подробнее о рангах"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <div className="flex -space-x-1">
              {Array.from({ length: rankInfo.stars }).map((_, i) => (
                <span key={i} className="text-amber-400 drop-shadow-sm">★</span>
              ))}
            </div>
            <span>{rankInfo.stars} звёзд{rankInfo.stars === 1 ? "а" : rankInfo.stars < 5 ? "ы" : ""}</span>
          </div>
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

      {/* Activity summary */}
      {showDetailed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Дней на сайте", value: daysSinceJoined.toLocaleString(), color: "text-blue-500" },
            { icon: BarChart3, label: "Глав/день (средн.)", value: avgChaptersPerDay, color: "text-green-500" },
            { icon: Bookmark, label: "Тайтлов в списке", value: totalBookmarks.toLocaleString(), color: "text-purple-500" },
            { icon: BookOpen, label: "Тайтлов прочитано", value: totalTitlesRead.toLocaleString(), color: "text-orange-500" },
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

      {/* Rank Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-center z-layer-modal p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-[var(--card)] rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-[var(--border)] shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">Система рангов</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Повышайте уровень для новых званий
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {Array.from({ length: 9 }, (_, i) => {
                const rankNum = 9 - i;
                const minLevel = (rankNum - 1) * 10;
                const maxLevel = rankNum === 9 ? 90 : rankNum * 10;
                const isCurrent = level >= minLevel && level < (rankNum === 9 ? Infinity : (rankNum * 10));
                const color = getRankColor(rankNum);

                return (
                  <div
                    key={rankNum}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isCurrent 
                        ? "shadow-lg" 
                        : "bg-[var(--secondary)]/30 border-[var(--border)]/50 hover:border-[var(--border)]"
                    }`}
                    style={isCurrent ? {
                      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                      borderColor: `${color}40`,
                    } : undefined}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {rankNum}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color }}>
                            {RANK_NAMES[rankNum]}
                          </p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            Уровни {minLevel} — {maxLevel === 90 ? "∞" : maxLevel}
                          </p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span 
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          Текущий
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
