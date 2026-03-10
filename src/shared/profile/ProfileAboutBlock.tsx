"use client";

import { UserProfile } from "@/types/user";
import ProfileLeaderboardBadges from "./ProfileLeaderboardBadges";
import { Calendar1, Heart } from "lucide-react";

interface ProfileAboutBlockProps {
  userProfile: UserProfile;
}

export default function ProfileAboutBlock({ userProfile }: ProfileAboutBlockProps) {
  const joinedDate = userProfile.createdAt ? new Date(userProfile.createdAt) : null;
  const joinedLabel =
    joinedDate && !Number.isNaN(joinedDate.getTime())
      ? joinedDate.toLocaleDateString("ru-RU")
      : null;
  const hasBio = Boolean(userProfile.bio?.trim());
  const hasGenre = Boolean(userProfile.favoriteGenre?.trim());
  const hasJoined = joinedLabel != null;

  return (
    <section
      className="profile-about-block rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4"
      aria-label="О пользователе"
    >
      {(hasBio || hasGenre || hasJoined) && (
        <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
          {hasBio && (
            <p className="profile-about-bio border-l-2 border-[var(--primary)]/50 pl-3 py-0.5 pr-2 italic text-[var(--foreground)]/90 leading-snug line-clamp-2 text-xs sm:text-sm w-full">
              {userProfile.bio}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {hasGenre && (
              <span className="inline-flex items-center gap-1 py-1 px-2 rounded-md bg-[var(--secondary)]/50 text-xs">
                <Heart className="w-3 h-3 text-pink-500 shrink-0" />
                <span className="truncate max-w-[140px]">{userProfile.favoriteGenre}</span>
              </span>
            )}
            {hasJoined && (
              <span className="inline-flex items-center gap-1 py-1 px-2 rounded-md bg-[var(--secondary)]/50 text-xs text-[var(--muted-foreground)]">
                <Calendar1 className="w-3 h-3 shrink-0" />
                С {joinedLabel}
              </span>
            )}
          </div>
        </div>
      )}
      <ProfileLeaderboardBadges userId={userProfile._id} />
    </section>
  );
}
