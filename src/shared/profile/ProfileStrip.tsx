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
import {
  Pencil,
  Sparkles,
  Shield,
  Coins,
  Flame,
  HelpCircle,
  Calendar,
  Heart,
  Cake,
} from "lucide-react";
import Tooltip from "@/shared/ui/Tooltip";
import { formatUsernameDisplay } from "@/lib/username-display";

interface ProfileStripProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  isOwnProfile?: boolean;
  isPublicView?: boolean;
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
  });
}

function formatBirthDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  const mod10 = age % 10;
  const mod100 = age % 100;
  let ending = "лет";
  if (mod100 >= 11 && mod100 <= 19) ending = "лет";
  else if (mod10 === 1) ending = "год";
  else if (mod10 >= 2 && mod10 <= 4) ending = "года";
  return `${age} ${ending}`;
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
  const longestStreak = userProfile.longestStreak ?? 0;
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";
  const rankInfo = levelToRank(level);
  const rankColor = getRankColor(rankInfo.rank);
  const showBalance = !isPublicView || isOwnProfile;
  const showStreak = !isPublicView || isOwnProfile || userProfile.showStats !== false;
  const hasPremium = isPremiumActive(userProfile.subscriptionExpiresAt);

  const streakLabel =
    currentStreak === 1 ? "день" : currentStreak >= 2 && currentStreak <= 4 ? "дня" : "дней";

  return (
    <div className="profile-hero-strip">
      {/* ── Верхняя строка: аватар + основная инфо ── */}
      <div className="profile-hero-top">
        {/* Аватар */}
        <div className="profile-hero-avatar-wrap">
          <div className="relative flex items-center justify-center overflow-visible">
            <ProfileAvatar userProfile={userProfile}  />
            <div className="absolute inset-0 pointer-events-none overflow-visible sm:hidden">
              <RankStarsOverlay userProfile={userProfile} size={120} />
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-visible hidden sm:block">
              <RankStarsOverlay userProfile={userProfile} size={145} />
            </div>
            {onAvatarUpdate && (
              <div className="absolute -bottom-1 -right-1 z-20">
                <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* Имя + роль + мета */}
        <div className="profile-hero-identity">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="profile-hero-username">
              {formatUsernameDisplay(userProfile.username)}
            </h1>
            {hasPremium && (
              <Tooltip content="Премиум-подписчик" position="top" showIcon={false}>
                <span className="inline-flex">
                  <PremiumBadge size="xs" ariaLabel="Премиум-подписчик" />
                </span>
              </Tooltip>
            )}
          </div>

          {/* Роль-бейдж */}
          <span
            className={`profile-hero-role-badge ${
              isAdmin ? "profile-hero-role-admin" : "profile-hero-role-user"
            }`}
          >
            {isAdmin ? (
              <Shield className="w-3 h-3 shrink-0" aria-hidden />
            ) : (
              <Sparkles className="w-3 h-3 shrink-0" aria-hidden />
            )}
            {isAdmin ? "Администратор" : "Культиватор"}
          </span>

          {/* Мета-теги: дата регистрации, день рождения, жанр */}
          <div className="profile-hero-meta">
            {userProfile.createdAt && (
              <span className="profile-hero-meta-chip">
                <Calendar className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                С {formatJoinDate(userProfile.createdAt)}
              </span>
            )}
            {userProfile.birthDate && (
              <span className="profile-hero-meta-chip">
                <Cake className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {formatBirthDate(userProfile.birthDate)}
              </span>
            )}
            {userProfile.favoriteGenre && (
              <span className="profile-hero-meta-chip">
                <Heart className="w-3 h-3 shrink-0 text-pink-500" aria-hidden />
                {userProfile.favoriteGenre}
              </span>
            )}
          </div>

          {/* Био (только если короткое) */}
          {userProfile.bio && (
            <p className="profile-hero-bio">{userProfile.bio}</p>
          )}
        </div>

      </div>

      {/* ── Нижняя строка: уровень + статы ── */}
      <div className="profile-hero-bottom">
        {/* Уровень + прогресс */}
        <div className="profile-hero-level-card">
          <div
            className="profile-hero-level-badge"
            style={{ backgroundColor: `${rankColor}22`, color: rankColor }}
          >
            {level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <p className="text-xs font-bold truncate" style={{ color: rankColor }}>
                {getRankDisplay(level)}
              </p>
              <Tooltip
                trigger="click"
                content={
                  <div className="space-y-2 max-w-[280px]">
                    <p className="font-semibold text-[var(--foreground)]">Уровни и ранги</p>
                    <p className="text-[var(--muted-foreground)] text-xs">
                      Уровень 0–90. 9 рангов по 10 уровней:
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
                  className="flex h-6 w-6 items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Справка по рангам"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden />
                </button>
              </Tooltip>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${expProgress}%`, backgroundColor: rankColor }}
              />
            </div>
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)] tabular-nums">
              {experience.toLocaleString()} / {nextLevelExp.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Баланс */}
        {showBalance && (
          <div className="profile-hero-stat-chip">
            <Coins className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                {balance.toLocaleString()}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">монет</p>
            </div>
          </div>
        )}

        {/* Серия */}
        {showStreak && (
          <div className="profile-hero-stat-chip">
            <Flame
              className={`w-4 h-4 shrink-0 ${currentStreak > 0 ? "text-orange-500" : "text-[var(--muted-foreground)]"}`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                {currentStreak} {streakLabel}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                рекорд {longestStreak}
              </p>
            </div>
          </div>
        )}

        {/* Кнопка редактирования */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="profile-hero-edit-btn max-w-[120px] sm:w-auto"
            aria-label="Редактировать профиль"
          >
            <Pencil className="w-4 h-4 shrink-0" aria-hidden />
            Редактировать
          </button>
        )}
      </div>
    </div>
  );
}
