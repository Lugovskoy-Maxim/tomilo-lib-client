"use client";

import { UserProfile } from "@/types/user";
import { BookOpen, Clock, HelpCircle, Coins, TrendingUp, Bookmark, Zap } from "lucide-react";
import { getRankColor, getRankDisplay, levelToRank, RANK_NAMES } from "@/lib/rank-utils";
import { useState } from "react";

interface ProfileStatsProps {
  userProfile: UserProfile;
}

export default function ProfileStats({ userProfile }: ProfileStatsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Рассчитываем статистику
  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChaptersRead =
    userProfile.readingHistory?.reduce((total, item) => {
      return total + (item.chapters?.length || 0);
    }, 0) || 0;

  const level = userProfile.level || 0;
  const experience = userProfile.experience || 0;
  const balance = userProfile.balance || 0;

  // Расчет прогресса до следующего уровня
  const currentLevelBaseExp = level * 100;
  const nextLevelExp = (level + 1) * 100;
  const expProgress = Math.min(((experience - currentLevelBaseExp) / 100) * 100, 100);

  // Форматирование времени чтения (примерное, предполагаем 2 минуты на главу)
  const formatReadingTime = (chapters: number) => {
    const minutes = chapters * 2;
    if (minutes < 60) {
      return `${minutes} мин`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days} д ${hours} ч`;
    }
  };

  const stats = [
    {
      icon: Zap,
      label: "Опыт",
      value: experience.toLocaleString(),
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Coins,
      label: "Баланс",
      value: balance.toLocaleString(),
      color: "from-amber-500 to-yellow-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: BookOpen,
      label: "Глав",
      value: totalChaptersRead.toLocaleString(),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Clock,
      label: "Время",
      value: formatReadingTime(totalChaptersRead),
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Bookmark,
      label: "Закладки",
      value: totalBookmarks.toLocaleString(),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative bg-[var(--card)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all duration-300 profile-card-hover overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative flex flex-col items-center justify-center gap-2">
              {/* Icon with gradient */}
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-[var(--foreground)] group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-[var(--muted-foreground)]">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Experience Progress Bar */}
      <div className="glass rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Прогресс уровня</span>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            {experience} / {nextLevelExp} XP
          </span>
        </div>
        <div className="exp-bar-container h-2.5">
          <div 
            className="exp-bar-fill h-full progress-animated"
            style={{ "--progress-width": `${expProgress}%` } as React.CSSProperties}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-[var(--muted-foreground)]">
          <span>Уровень {level}</span>
          <span>Уровень {level + 1}</span>
        </div>
      </div>

      {/* Rank Display */}
      <div className="glass rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold rank-badge"
            style={{ color: getRankColor(levelToRank(level).rank) }}
          >
            {levelToRank(level).rank}
          </div>
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">Ранг силы</div>
            <div 
              className="text-lg font-bold"
              style={{ color: getRankColor(levelToRank(level).rank) }}
            >
              {getRankDisplay(level)}
            </div>
          </div>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={() => setIsModalOpen(true)}
          title="Подробнее о рангах"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Rank Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-[var(--card)] rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto border border-[var(--border)] shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">Система рангов</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Повышайте уровень, чтобы достичь новых высот
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 9 }, (_, i) => {
                const rankNum = 9 - i;
                const minLevel = (rankNum - 1) * 10;
                const maxLevel = rankNum === 9 ? 90 : rankNum * 10;
                const isCurrent = level >= minLevel && level < (rankNum === 9 ? Infinity : (rankNum * 10));

                return (
                  <div
                    key={rankNum}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      isCurrent 
                        ? "bg-gradient-to-r from-[var(--primary)]/10 to-[var(--chart-1)]/10 border-[var(--primary)]/30 shadow-lg" 
                        : "bg-[var(--secondary)]/50 border-[var(--border)] hover:border-[var(--primary)]/20"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                          style={{ 
                            backgroundColor: `${getRankColor(rankNum)}20`,
                            color: getRankColor(rankNum)
                          }}
                        >
                          {rankNum}
                        </div>
                        <div className="font-semibold text-sm" style={{ color: getRankColor(rankNum) }}>
                          {RANK_NAMES[rankNum]}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-[var(--primary)] text-[var(--primary-foreground)] px-2.5 py-1 rounded-full font-medium">
                          Текущий
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-2 ml-11">
                      Уровни {minLevel} — {maxLevel === 90 ? "∞" : maxLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
