"use client";

import { UserProfile } from "@/types/user";
import { ProfileAvatar, EditAvatarButton } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import { Button } from "@/shared/ui/button";
import { Pencil, Sparkles, Shield, Calendar1, Play } from "lucide-react";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank } from "@/lib/rank-utils";
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

        {/* Уровень и ранг - компактный вид */}
        <div 
          className="relative rounded-xl p-3 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${rankColor}10 0%, ${rankColor}05 100%)`,
            border: `1px solid ${rankColor}30`,
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0"
              style={{ 
                backgroundColor: `${rankColor}20`,
                color: rankColor,
                boxShadow: `0 0 12px ${rankColor}30`
              }}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <p 
                className="text-sm font-bold leading-tight truncate"
                style={{ color: rankColor }}
              >
                {getRankDisplay(level)}
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--secondary)]/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${expProgress}%`,
                    background: `linear-gradient(90deg, ${rankColor} 0%, ${rankColor}cc 100%)`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                {experience.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
              </p>
            </div>
          </div>
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
    </aside>
  );
}
