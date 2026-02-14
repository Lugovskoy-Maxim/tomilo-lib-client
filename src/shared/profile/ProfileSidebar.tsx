"use client";

import { UserProfile } from "@/types/user";
import { ProfileAvatar, EditAvatarButton } from "@/shared";
import RankStarsOverlay from "./RankStarsOverlay";
import { Button } from "@/shared/ui/button";
import { Pencil, Sparkles, Shield, Calendar1, Zap, Coins, BookOpen, Bookmark } from "lucide-react";
import { getRankColor, getRankDisplay, getLevelProgress, levelToRank } from "@/lib/rank-utils";

interface ProfileSidebarProps {
  userProfile: UserProfile;
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
}

export default function ProfileSidebar({ userProfile, onEdit, onAvatarUpdate }: ProfileSidebarProps) {
  const level = userProfile.level ?? 0;
  const experience = userProfile.experience ?? 0;
  const balance = userProfile.balance ?? 0;
  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChapters =
    userProfile.readingHistory?.reduce((t, item) => t + (item.chapters?.length || 0), 0) || 0;
  const { progressPercent: expProgress, nextLevelExp } = getLevelProgress(level, experience);
  const isAdmin = userProfile.role === "admin";

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-sm sticky top-4">
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
          <h1 className="text-lg font-bold text-[var(--foreground)] truncate px-1">
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
            className="w-full mb-4 rounded-xl border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/50"
          >
            <Pencil className="h-4 w-4 mr-2 shrink-0" />
            Редактировать профиль
          </Button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)] mb-4">
          <Calendar1 className="w-3.5 h-3.5 shrink-0" />
          На сайте с {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
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
            className="mt-2 text-center text-xs font-semibold"
            style={{ color: getRankColor(levelToRank(level).rank) }}
          >
            {getRankDisplay(level)}
          </div>
        </div>

        {/* Краткая статистика */}
        <div className="space-y-2">
          {[
            { icon: Zap, label: "Опыт", value: experience.toLocaleString() },
            { icon: Coins, label: "Монеты", value: balance.toLocaleString() },
            { icon: BookOpen, label: "Глав", value: totalChapters.toLocaleString() },
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
