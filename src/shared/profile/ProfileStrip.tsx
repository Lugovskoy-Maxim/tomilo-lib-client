"use client";

import { UserProfile } from "@/types/user";
import ProfileAvatar from "@/shared/profile/ProfileAvatar";
import EditAvatarButton from "@/shared/profile/ProfileEditAvatarButton";
import RankStarsOverlay from "./RankStarsOverlay";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank, RANK_NAMES } from "@/lib/rank-utils";
import { isPremiumActive } from "@/lib/premium";
import { PremiumBadge } from "@/shared/premium-badge/PremiumBadge";
import { Pencil, Sparkles, Shield, Coins, Flame, HelpCircle } from "lucide-react";
import Tooltip from "@/shared/ui/Tooltip";

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
    <div className="flex flex-wrap items-center gap-4 sm:gap-5 py-4 px-4 sm:px-5 rounded-2xl border border-[color-mix(in_oklch,var(--border)_70%,transparent)] bg-[color-mix(in_oklch,var(--card)_88%,transparent)] dark:bg-[color-mix(in_oklch,var(--card)_58%,transparent)] backdrop-blur-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]">
      {/* Аватар: контейнер с overflow-visible и отступом, чтобы рамка и эффекты не обрезались */}
      <div className="relative w-[7rem] h-[7rem] shrink-0 flex items-center justify-center overflow-visible rounded-full ring-2 ring-[var(--border)]/50">
        <div className="relative w-24 h-24 flex items-center justify-center overflow-visible">
          <ProfileAvatar userProfile={userProfile} size="sm" />
          <div className="absolute inset-0 pointer-events-none overflow-visible">
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
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] truncate flex items-center gap-2 flex-wrap">
          {userProfile.username}
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
            isAdmin ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-[var(--primary)]/10 text-[var(--primary)]"
          }`}
        >
          {isAdmin ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
          {isAdmin ? "Админ" : "Культиватор"}
        </span>
      </div>

      {/* Уровень — на узких экранах переносим на новую строку, чтобы не наезжал на никнейм */}
      <div
        className="profile-strip-level relative flex items-center gap-2 sm:gap-3 py-2 px-3 rounded-xl border border-[var(--border)]/70 min-w-0 z-0 basis-full w-max sm:basis-auto overflow-visible"
        style={{ background: `linear-gradient(135deg, ${rankColor}12 0%, transparent 100%)` }}
      >
        <span className="absolute inset-0 rounded-xl bg-[var(--card)] opacity-72 dark:opacity-50 pointer-events-none z-0" aria-hidden />
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
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
            <div className="mt-1 h-1 rounded-full bg-[var(--secondary)] overflow-hidden max-w-[80px] hidden min-[400px]:block">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${expProgress}%`, backgroundColor: rankColor }}
              />
            </div>
            <div className="flex items-center gap-1 min-w-0 hidden min-[400px]:flex">
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                {experience.toLocaleString()}/{nextLevelExp.toLocaleString()} XP
              </p>
              <Tooltip
                content={
                  <div className="space-y-2 max-w-[280px]">
                    <p className="font-semibold text-[var(--foreground)]">Уровни и ранги</p>
                    <p className="text-[var(--muted-foreground)]">
                      Уровень 0–90. XP для следующего уровня растёт с каждым уровнем. 9 рангов по 10 уровней:
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
                <span className="inline-flex shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-help">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Баланс и серия — в одну группу */}
      {(showBalance || showStreak) && (
        <div className="flex items-center gap-2">
          {showBalance && (
            <div className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)]/50">
              <Coins className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold tabular-nums">{balance.toLocaleString()}</span>
            </div>
          )}
          {showStreak && (
            <div className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)]/50">
              <Flame className="w-4 h-4 text-orange-500 shrink-0" />
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--secondary)]/50 hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2"
        >
          <Pencil className="w-4 h-4 shrink-0" />
          Редактировать
        </button>
      )}
    </div>
  );
}
