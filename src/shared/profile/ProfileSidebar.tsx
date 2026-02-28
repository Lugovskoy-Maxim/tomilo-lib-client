"use client";

import { UserProfile } from "@/types/user";
import { ProfileAvatar, EditAvatarButton } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import { Button } from "@/shared/ui/button";
import { Pencil, Sparkles, Shield, Calendar1, Zap, Coins, BookOpen, Bookmark, Info, Crown, TrendingUp, Play } from "lucide-react";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank, RANK_NAMES } from "@/lib/rank-utils";
import { useProgressNotification } from "@/contexts/ProgressNotificationContext";

interface ProfileSidebarProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  isOwnProfile?: boolean;
}

export default function ProfileSidebar({ userProfile, onEdit, onAvatarUpdate, isOwnProfile = false }: ProfileSidebarProps) {
  const { showLevelUp, showAchievement, showExpGain } = useProgressNotification();
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length ?? 0;
  const isReadingHistoryPrivate = userProfile.privacy?.readingHistoryVisibility !== "public";
  const chaptersSum = userProfile.readingHistory?.reduce(
    (t, item) => t + (item.chaptersCount ?? item.chapters?.length ?? 0),
    0,
  ) ?? 0;
  const totalChapters = isOwnProfile ? chaptersSum : (isReadingHistoryPrivate ? null : chaptersSum);
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const isJoinedDateVisible = joinedDate != null && !Number.isNaN(joinedDate.getTime());
  const joinedAtLabel = joinedDate && !Number.isNaN(joinedDate.getTime())
    ? joinedDate.toLocaleDateString("ru-RU")
    : "дата скрыта";

  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);

  return (
    <aside className="w-full xl:w-auto xl:shrink-0">
      <div className="relative rounded-2xl border border-[var(--border)]/60 bg-gradient-to-b from-[var(--card)] to-[var(--card)]/80 backdrop-blur-md p-4 sm:p-5 shadow-lg sticky top-2 sm:top-4 xl:static overflow-hidden">
        {/* Декоративный градиент на фоне */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${rankColor} 0%, transparent 50%)`,
          }}
        />

        {/* Аватар с улучшенным свечением */}
        <div className="relative flex justify-center mb-5 pt-8 pb-4">
          <div 
            className="absolute inset-0 blur-3xl opacity-20 pointer-events-none transition-opacity duration-500"
            style={{ background: `radial-gradient(circle, ${rankColor} 0%, transparent 70%)` }}
          />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32">
            <ProfileAvatar userProfile={userProfile} size="sm" />
            <div className="absolute inset-0 pointer-events-none">
              <RankStarsOverlay userProfile={userProfile} size={112} />
            </div>
            {onAvatarUpdate && (
              <div className="absolute -bottom-1 -right-1 z-10">
                <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* Имя и роль */}
        <div className="text-center mb-4 relative z-10">
          <h1 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate px-1 mb-2">
            {userProfile.username}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                isAdmin
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-500 border border-red-500/30 shadow-sm shadow-red-500/10"
                  : "bg-gradient-to-r from-[var(--primary)]/15 to-[var(--chart-1)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shadow-sm shadow-[var(--primary)]/10"
              }`}
            >
              {isAdmin ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {isAdmin ? "Администратор" : "Культиватор"}
            </span>
          </div>
        </div>

        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="w-full mb-4 rounded-xl border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 text-xs sm:text-sm px-3 py-2.5 transition-all duration-300 group"
          >
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 shrink-0 transition-transform group-hover:rotate-12" />
            <span className="truncate">Редактировать профиль</span>
          </Button>
        )}

        {/* Дата регистрации */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)] mb-5 py-2 px-3 rounded-lg bg-[var(--secondary)]/30">
          <Calendar1 className="w-3.5 h-3.5 shrink-0 text-[var(--chart-2)]" />
          <span>
            На сайте с{" "}
            <span className={isJoinedDateVisible ? "text-[var(--foreground)] font-medium" : "text-amber-500 font-medium"}>
              {joinedAtLabel}
            </span>
          </span>
        </div>

        {/* Уровень и ранг - улучшенный дизайн */}
        <div 
          className="relative rounded-xl p-4 mb-4 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${rankColor}10 0%, ${rankColor}05 100%)`,
            border: `1px solid ${rankColor}30`,
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none">
            <Crown className="w-full h-full" style={{ color: rankColor }} />
          </div>
          
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ 
                  backgroundColor: `${rankColor}20`,
                  color: rankColor,
                  boxShadow: `0 0 12px ${rankColor}30`
                }}
              >
                {level}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Уровень</span>
                <p 
                  className="text-xs font-bold leading-tight"
                  style={{ color: rankColor }}
                >
                  {getRankDisplay(level)}
                </p>
              </div>
            </div>
            <div className="relative group/rank-help">
              <button
                type="button"
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                aria-label="Показать шкалу уровней ранга"
              >
                <Info className="w-4 h-4" />
              </button>
              <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-xl opacity-0 invisible transition-all duration-150 group-hover/rank-help:opacity-100 group-hover/rank-help:visible group-hover/rank-help:pointer-events-auto group-focus-within/rank-help:opacity-100 group-focus-within/rank-help:visible">
                <p className="text-xs font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Шкала рангов
                </p>
                <ul className="space-y-1">
                  {RANK_NAMES.slice(1).map((rankName, idx) => {
                    const rank = idx + 1;
                    const minLevel = idx * 10;
                    const maxLevel = rank === 9 ? 90 : rank * 10 - 1;
                    const isCurrentRank = rankInfo.rank === rank;
                    return (
                      <li
                        key={rank}
                        className={`flex items-center justify-between gap-2 text-[11px] py-1 px-1.5 rounded ${isCurrentRank ? 'bg-[var(--primary)]/10' : ''}`}
                      >
                        <span 
                          className="truncate font-medium"
                          style={{ color: isCurrentRank ? getRankColor(rank) : 'var(--foreground)' }}
                        >
                          {rankName}
                        </span>
                        <span className="text-[var(--muted-foreground)] shrink-0">
                          ур. {minLevel}-{maxLevel}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* Прогресс-бар с анимацией */}
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-[var(--secondary)]/80 overflow-hidden">
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
            <div className="flex items-center justify-between text-[10px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {experience.toLocaleString()} XP
              </span>
              <span>{nextLevelExp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Статистика - улучшенные карточки */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Zap, label: "Опыт", value: experience.toLocaleString(), color: "from-yellow-500 to-orange-500", show: true },
            { icon: Coins, label: "Монеты", value: balance.toLocaleString(), color: "from-amber-400 to-yellow-500", show: isOwnProfile },
            { icon: BookOpen, label: "Глав", value: totalChapters == null ? "—" : totalChapters.toLocaleString(), color: "from-blue-500 to-cyan-500", show: true },
            { icon: Bookmark, label: "Закладки", value: totalBookmarks.toLocaleString(), color: "from-purple-500 to-pink-500", show: true },
          ]
            .filter(({ show }) => show)
            .map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="group relative flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 hover:border-[var(--border)] hover:bg-[var(--secondary)]/60 transition-all duration-300"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${color} mb-1.5 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                {value}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Демо-кнопка для тестирования уведомлений (только в dev-режиме) */}
        {isOwnProfile && process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={() => {
              const demoOldRank = levelToRank(level);
              const demoNewRank = levelToRank(level + 1);
              
              showExpGain(25, "За чтение главы");
              
              setTimeout(() => {
                showAchievement({
                  id: "demo-achievement",
                  name: "Книжный червь",
                  description: "Прочитать 50 глав",
                  icon: "book",
                  type: "reading",
                  rarity: "rare",
                  unlockedAt: new Date().toISOString(),
                });
              }, 500);
              
              setTimeout(() => {
                showLevelUp(level, level + 1, demoOldRank, demoNewRank);
              }, 1000);
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-xs font-medium text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Демо уведомлений
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </aside>
  );
}
