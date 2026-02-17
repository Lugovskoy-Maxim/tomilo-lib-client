"use client";

import { UserProfile } from "@/types/user";
import { ProfileAvatar, EditAvatarButton } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import { Button } from "@/shared/ui/button";
import { Pencil, Sparkles, Shield, Calendar1, Zap, Coins, BookOpen, Bookmark, Info } from "lucide-react";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank, RANK_NAMES } from "@/lib/rank-utils";

interface ProfileSidebarProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

export default function ProfileSidebar({ userProfile, onEdit, onAvatarUpdate }: ProfileSidebarProps) {
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length ?? 0;
  const isReadingHistoryPrivate = userProfile.privacy?.readingHistoryVisibility !== "public";
  const totalChapters = isReadingHistoryPrivate
    ? null
    : (userProfile.readingHistory?.reduce((t, item) => t + (item.chapters?.length || 0), 0) ?? 0);
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const isJoinedDateVisible =
    joinedDate != null && !Number.isNaN(joinedDate.getTime());
  const joinedAtLabel =
    joinedDate && !Number.isNaN(joinedDate.getTime())
      ? joinedDate.toLocaleDateString("ru-RU")
      : "дата скрыта";

  return (
    <aside className="w-full xl:w-auto xl:shrink-0">
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm sticky top-2 sm:top-4 xl:static">
        {/* Аватар по центру + смена аватара (только свой профиль) */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <ProfileAvatar userProfile={userProfile} size="sm" />
            <div className="absolute inset-0 pointer-events-none">
              <RankStarsOverlay userProfile={userProfile} size={96} />
            </div>
            {onAvatarUpdate && (
              <div className="absolute -bottom-0.5 -right-0.5 z-10">
                <EditAvatarButton onAvatarUpdate={onAvatarUpdate} />
              </div>
            )}
          </div>
        </div>

        <div className="text-center mb-3">
          <h1 className="text-sm font-bold text-[var(--foreground)] truncate px-1">
            {userProfile.username}
          </h1>
          <span
            className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
              isAdmin
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {isAdmin ? <Shield className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {isAdmin ? "Админ" : "Культиватор"}
          </span>
        </div>

        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="w-full mb-3 sm:mb-4 rounded-xl border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50 text-xs sm:text-sm px-3 py-2"
          >
            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 shrink-0" />
            <span className="truncate">Редактировать профиль</span>
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-4">
          <Calendar1 className="w-3.5 h-3.5 shrink-0" />
          <span>
            На сайте с{" "}
            <span
              className={
                isJoinedDateVisible
                  ? "text-[var(--foreground)]"
                  : "text-amber-600 dark:text-amber-400 font-medium"
              }
            >
              {joinedAtLabel}
            </span>
          </span>
        </div>

        {/* Уровень и ранг */}
        <div className="rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 p-3 mb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs text-[var(--muted-foreground)]">Уровень</span>
            <span className="text-sm font-bold text-[var(--foreground)]">{level}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
              style={{ width: `${expProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {experience} / {nextLevelExp} XP
            </span>
          </div>
          <div
            className="mt-2 flex items-center justify-center gap-1.5"
          >
            <span
              className="text-center text-xs font-semibold"
              style={{ color: getRankColor(levelToRank(level).rank) }}
            >
              {getRankDisplay(level)}
            </span>
            <div className="relative group/rank-help">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                aria-label="Показать шкалу уровней ранга"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-left shadow-xl opacity-0 invisible transition-all duration-150 group-hover/rank-help:opacity-100 group-hover/rank-help:visible group-focus-within/rank-help:opacity-100 group-focus-within/rank-help:visible">
                <p className="text-xs font-semibold text-[var(--foreground)] mb-2">Шкала уровней</p>
                <ul className="space-y-1.5">
                  {RANK_NAMES.slice(1).map((rankName, idx) => {
                    const rank = idx + 1;
                    const minLevel = idx * 10;
                    const maxLevel = rank === 9 ? 90 : rank * 10 - 1;

                    return (
                      <li
                        key={rank}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="text-[var(--foreground)] truncate">{rankName}</span>
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
        </div>

        {/* Краткая статистика */}
        <div className="space-y-2">
          {[
            { icon: Zap, label: "Опыт", value: experience.toLocaleString() },
            { icon: Coins, label: "Монеты", value: balance.toLocaleString() },
            { icon: BookOpen, label: "Глав", value: totalChapters == null ? "—" : totalChapters.toLocaleString() },
            { icon: Bookmark, label: "Закладки", value: totalBookmarks.toLocaleString() },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)]/50"
            >
              <span className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <Icon className="w-3.5 h-3.5 text-[var(--primary)]" />
                {label}
              </span>
              <span className="text-xs font-semibold tabular-nums text-[var(--foreground)]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
