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
    <section className="profile-about-block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 mb-5" aria-label="О пользователе">
      {(hasBio || hasGenre || hasJoined) && (
        <div className="flex flex-wrap items-center gap-3 gap-y-2 text-sm mb-4">
          {hasBio && (
            <p className="profile-about-bio border-l-4 border-[var(--primary)]/50 pl-4 py-1 pr-2 italic text-[var(--foreground)]/90 leading-relaxed max-w-2xl w-full">
              {userProfile.bio}
            </p>
          )}
          {hasGenre && (
            <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)]/50">
              <Heart className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="font-medium text-[var(--foreground)]">{userProfile.favoriteGenre}</span>
            </span>
          )}
          {hasJoined && (
            <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[var(--secondary)]/60 border border-[var(--border)]/50">
              <Calendar1 className="w-4 h-4 shrink-0" />
              На сайте с {joinedLabel}
            </span>
          )}
        </div>
      )}
      <ProfileLeaderboardBadges userId={userProfile._id} />
    </section>
  );
}
