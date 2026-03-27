"use client";

import { UserProfile } from "@/types/user";
import ProfileAvatar from "@/shared/profile/ProfileAvatar";
import EditAvatarButton from "@/shared/profile/ProfileEditAvatarButton";
import RankStarsOverlay from "./RankStarsOverlay";
import ProfileLeaderboardBadges from "./ProfileLeaderboardBadges";
import { Button } from "@/shared/ui/button";
import { Pencil, Sparkles, Shield, Calendar1, Play, Coins, Flame, Heart } from "lucide-react";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank } from "@/lib/rank-utils";
import { useProgressNotification } from "@/contexts/ProgressNotificationContext";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import { formatUsernameDisplay } from "@/lib/username-display";

interface ProfileSidebarProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  isOwnProfile?: boolean;
  /** Публичный просмотр (чужой профиль) — скрывает приватные данные */
  isPublicView?: boolean;
}

export default function ProfileSidebar({
  userProfile,
  onEdit,
  onAvatarUpdate,
  isOwnProfile = false,
  isPublicView = false,
}: ProfileSidebarProps) {
  const { showLevelUp, showAchievement, showExpGain } = useProgressNotification();
  const level = userProfile.level ?? 0;

  const showBalance = !isPublicView || isOwnProfile;
  const showStreak = !isPublicView || isOwnProfile || userProfile.showStats !== false;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;
  const currentStreak = userProfile.currentStreak ?? 0;
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const isJoinedDateVisible = joinedDate != null && !Number.isNaN(joinedDate.getTime());
  const joinedAtLabel =
    joinedDate && !Number.isNaN(joinedDate.getTime())
      ? joinedDate.toLocaleDateString("ru-RU")
      : "дата скрыта";

  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);

  return (
    <aside className="w-full xl:w-auto xl:shrink-0">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sticky top-2 sm:top-4 xl:static">
        {/* Аватар */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28">
            <ProfileAvatar userProfile={userProfile} size="sm" />
            <div className="absolute inset-0 pointer-events-none">
              <RankStarsOverlay userProfile={userProfile} size={112} />
            </div>
            {onAvatarUpdate && (
              <div className="absolute -bottom-0.5 -right-0.5 z-10">
                <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* Имя и роль */}
        <div className="text-center mb-3">
          <h1 className="text-base font-semibold text-[var(--foreground)] truncate px-1 flex items-center justify-center gap-1.5 flex-wrap">
            {formatUsernameDisplay(userProfile.username)}
            {isPremiumActive(userProfile.subscriptionExpiresAt) && (
              <PremiumBadge size="xs" ariaLabel="Премиум" />
            )}
          </h1>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium mt-1.5 ${
              isAdmin
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {isAdmin ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isAdmin ? "Админ" : "Культиватор"}
          </span>
        </div>

        {userProfile.bio && (
          <p className="text-xs text-[var(--muted-foreground)] text-center leading-relaxed line-clamp-3 mb-3 px-1">
            {userProfile.bio}
          </p>
        )}

        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="w-full mb-4 rounded-lg border-[var(--border)] hover:bg-[var(--accent)] text-xs py-2 h-8"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Редактировать
          </Button>
        )}

        {/* Баланс и серия */}
        {(showBalance || showStreak) && (
          <div
            className={`grid gap-1.5 mb-3 ${showBalance && showStreak ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {showBalance && (
              <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--secondary)]/50">
                <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-medium tabular-nums truncate">
                  {balance.toLocaleString()}
                </span>
              </div>
            )}
            {showStreak && (
              <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--secondary)]/50">
                <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="text-[11px] font-medium tabular-nums">
                  {currentStreak}{" "}
                  {currentStreak === 1 ? "день" : currentStreak < 5 ? "дня" : "дней"}
                </span>
              </div>
            )}
          </div>
        )}

        {userProfile.favoriteGenre && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-3 py-1.5 px-2 rounded-lg bg-[var(--secondary)]/40">
            <Heart className="w-3 h-3 text-pink-500 shrink-0" />
            <span className="truncate">{userProfile.favoriteGenre}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-4 py-1.5 px-2 rounded-lg bg-[var(--secondary)]/40">
          <Calendar1 className="w-3 h-3 shrink-0" />
          На сайте с {isJoinedDateVisible ? joinedAtLabel : "—"}
        </div>

        {/* Уровень и прогресс */}
        <div
          className="rounded-lg p-2.5 border border-[var(--border)]/80"
          style={{ background: `linear-gradient(135deg, ${rankColor}08 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: `${rankColor}20`, color: rankColor }}
            >
              {level}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: rankColor }}>
                {getRankDisplay(level)}
              </p>
              <div className="mt-1 h-1 rounded-full bg-[var(--secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${expProgress}%`, backgroundColor: rankColor }}
                />
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                {experience.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <ProfileLeaderboardBadges userId={userProfile._id} />
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
