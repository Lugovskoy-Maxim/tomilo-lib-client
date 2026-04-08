"use client";

import { UserProfile } from "@/types/user";
import ProfileAvatar from "@/shared/profile/ProfileAvatar";
import EditAvatarButton from "@/shared/profile/ProfileEditAvatarButton";
import RankStarsOverlay from "./RankStarsOverlay";
import {
  getRankColor,
  getRankDisplay,
  getLevelProgress,
  levelToRank,
  RANK_NAMES,
} from "@/lib/rank-utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import { Pencil, Sparkles, Shield, Coins, Flame, HelpCircle } from "lucide-react";
import Tooltip from "@/shared/ui/Tooltip";
import { formatUsernameDisplay } from "@/lib/username-display";

interface ProfileStripProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  isOwnProfile?: boolean;
  isPublicView?: boolean;
}

export default function ProfileStrip({
  userProfile,
  onEdit,
  onAvatarUpdate,
  isOwnProfile = false,
  isPublicView = false,
}: ProfileStripProps) {
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;
  const currentStreak = userProfile.currentStreak ?? 0;
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";
  const rankColor = getRankColor(levelToRank(level).rank);
  const showBalance = !isPublicView || isOwnProfile;
  const showStreak = !isPublicView || isOwnProfile || userProfile.showStats !== false;

  return (
    <div className="flex flex-col gap-3 py-3 px-2.5 min-[400px]:px-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-4 rounded-xl border border-[var(--border)]/80 bg-[var(--card)]/95 backdrop-blur-sm">
      {/* Верхняя строка на мобильных: аватар + имя */}
      <div className="flex items-center gap-3 min-w-0 sm:contents">
      {/* Аватар: контейнер с overflow-visible и отступом, чтобы рамка и эффекты не обрезались */}
      <div className="relative w-[5.5rem] h-[5.5rem] shrink-0 flex items-center justify-center overflow-visible rounded-full ring-2 ring-[var(--border)]/50 sm:w-[7rem] sm:h-[7rem]">
        <div className="relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 flex items-center justify-center overflow-visible">
          <ProfileAvatar userProfile={userProfile} size="sm" />
          <div className="absolute inset-0 pointer-events-none overflow-visible sm:hidden">
            <RankStarsOverlay userProfile={userProfile} size={72} />
          </div>
          <div className="absolute inset-0 pointer-events-none overflow-visible hidden sm:block">
            <RankStarsOverlay userProfile={userProfile} size={96} />
          </div>
          {onAvatarUpdate && (
            <div className="absolute -bottom-0.5 -right-0.5 z-10">
              <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
            </div>
          )}
        </div>
      </div>

      {/* Имя и роль */}
      <div className="min-w-0 flex-1 sm:min-w-[12rem]">
        <h1 className="text-base min-[400px]:text-lg sm:text-xl font-semibold text-[var(--foreground)] break-words [overflow-wrap:anywhere] flex items-center gap-2 flex-wrap">
          {formatUsernameDisplay(userProfile.username)}
          {isPremiumActive(userProfile.subscriptionExpiresAt) && (
            <Tooltip content="Премиум-подписчик" position="top" showIcon={false}>
              <span className="inline-flex">
                <PremiumBadge size="xs" ariaLabel="Премиум-подписчик" />
              </span>
            </Tooltip>
          )}
        </h1>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
            isAdmin
              ? "bg-red-500/15 text-red-600 dark:text-red-400"
              : "bg-[var(--primary)]/10 text-[var(--primary)]"
          }`}
        >
          {isAdmin ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {isAdmin ? "Админ" : "Культиватор"}
        </span>
      </div>
      </div>

      {/* Уровень — на мобильных на всю ширину */}
      <div className="profile-strip-level relative flex w-full items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-lg border border-[var(--border)]/60 min-w-0 z-0 sm:w-max sm:basis-auto sm:max-w-none overflow-visible bg-[var(--muted)]/5">
        <div className="relative z-10 flex w-full min-w-0 items-center gap-2 sm:gap-3 sm:w-auto sm:flex-initial">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
            style={{ backgroundColor: `${rankColor}25`, color: rankColor }}
          >
            {level}
          </div>
          {/* Название ранга всегда видно; прогресс и XP — от 400px */}
          <div className="min-w-0 flex-1 sm:flex-initial">
            <p className="text-xs font-semibold truncate" style={{ color: rankColor }}>
              {getRankDisplay(level)}
            </p>
            <div className="mt-1.5 h-1.5 sm:h-1 rounded-full bg-[var(--secondary)] overflow-hidden w-full max-w-full sm:max-w-[120px]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${expProgress}%`, backgroundColor: rankColor }}
              />
            </div>
            <div className="mt-0.5 flex items-center gap-1 min-w-0 w-full">
              <p className="text-[10px] sm:text-[10px] text-[var(--muted-foreground)] truncate flex-1 tabular-nums">
                {experience.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
              </p>
              <Tooltip
                trigger="click"
                content={
                  <div className="space-y-2 max-w-[280px]">
                    <p className="font-semibold text-[var(--foreground)]">Уровни и ранги</p>
                    <p className="text-[var(--muted-foreground)]">
                      Уровень 0–90. XP для следующего уровня растёт с каждым уровнем. 9 рангов по 10
                      уровней:
                    </p>
                    <ul className="text-[10px] text-[var(--muted-foreground)] space-y-0.5 list-decimal list-inside">
                      {RANK_NAMES.slice(1).map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                }
                position="top"
                showIcon={false}
              >
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)]/15 hover:text-[var(--foreground)] transition-colors touch-manipulation sm:h-9 sm:w-9"
                  aria-label="Справка по уровням и рангам"
                >
                  <HelpCircle className="w-4 h-4" aria-hidden />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Баланс и серия */}
      {(showBalance || showStreak) && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          {showBalance && (
            <div className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--muted)]/5 px-3 py-2 sm:min-h-0 sm:flex-none sm:justify-start">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
              <span className="text-sm font-semibold tabular-nums">{balance.toLocaleString()}</span>
            </div>
          )}
          {showStreak && (
            <div className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)]/60 bg-[var(--muted)]/5 px-3 py-2 sm:min-h-0 sm:flex-none sm:justify-start">
              <Flame className="w-4 h-4 text-orange-500 shrink-0" aria-hidden />
              <span className="text-sm font-semibold tabular-nums">
                {currentStreak} {currentStreak === 1 ? "день" : currentStreak < 5 ? "дня" : "дней"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Редактировать */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)]/80 bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]/10 transition-colors touch-manipulation focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 sm:min-h-0 sm:w-auto sm:justify-center"
        >
          <Pencil className="w-4 h-4 shrink-0" aria-hidden />
          Редактировать
        </button>
      )}
    </div>
  );
}
