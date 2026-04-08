"use client";

import { UserProfile } from "@/types/user";
import ProfileLeaderboardBadges from "./ProfileLeaderboardBadges";
import { Heart, Cake } from "lucide-react";

interface ProfileAboutBlockProps {
  userProfile: UserProfile;
}

function formatBirthDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  const formattedDate = date.toLocaleDateString("ru-RU");
  const mod10 = age % 10;
  const mod100 = age % 100;
  let ending = "лет";
  if (mod100 >= 11 && mod100 <= 19) ending = "лет";
  else if (mod10 === 1) ending = "год";
  else if (mod10 >= 2 && mod10 <= 4) ending = "года";
  return `${formattedDate} · ${age} ${ending}`;
}

export default function ProfileAboutBlock({ userProfile }: ProfileAboutBlockProps) {
  const hasBio = Boolean(userProfile.bio?.trim());
  const hasGenre = Boolean(userProfile.favoriteGenre?.trim());
  const hasBirth = Boolean(userProfile.birthDate?.trim());

  const hasTop = hasBio || hasGenre || hasBirth;

  return (
    <section
      className="profile-glass-card rounded-xl p-4 sm:p-5"
      aria-label="О пользователе"
    >
      {hasTop && (
        <div className="space-y-3">
          {hasBio && (
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {userProfile.bio}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {hasBirth && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)]/70 bg-[var(--muted)]/5 px-2 py-1 text-xs text-[var(--muted-foreground)]">
                <Cake className="h-3.5 w-3.5 shrink-0 text-[var(--foreground)]/70" aria-hidden />
                {formatBirthDateLabel(userProfile.birthDate!)}
              </span>
            )}
            {hasGenre && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)]/70 bg-[var(--muted)]/5 px-2 py-1 text-xs text-[var(--foreground)]">
                <Heart className="h-3.5 w-3.5 shrink-0 text-pink-500" aria-hidden />
                <span className="truncate max-w-[200px]">{userProfile.favoriteGenre}</span>
              </span>
            )}
          </div>
        </div>
      )}
      <div className={hasTop ? "mt-4 pt-4 border-t border-[var(--border)]/50" : ""}>
        <ProfileLeaderboardBadges userId={userProfile._id} />
      </div>
    </section>
  );
}
