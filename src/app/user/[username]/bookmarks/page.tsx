"use client";

import { useParams } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useGetProfileByUsernameQuery } from "@/store/api/authApi";
import { UserProfile } from "@/types/user";
import { User } from "@/types/auth";
import { ReadingHistoryEntry } from "@/types/store";
import { normalizeBookmarks } from "@/lib/bookmarks";
import ProfileBookmarksGrid from "@/widgets/profile-bookmarks/ProfileBookmarksGrid";

function transformUserToProfile(user: User): UserProfile {
  const u = user as User & { equippedDecorations?: UserProfile["equippedDecorations"] };
  return {
    _id: u._id || u.id,
    username: u.username,
    email: u.email ?? "",
    emailVerified: u.emailVerified,
    avatar: u.avatar || "",
    role: u.role,
    level: u.level,
    experience: u.experience,
    balance: u.balance,
    bookmarks: normalizeBookmarks(u.bookmarks),
    readingHistory: Array.isArray(u.readingHistory)
      ? (u.readingHistory as ReadingHistoryEntry[]).map(item => ({
          ...item,
          titleId: item.titleId,
          chapters: Array.isArray(item.chapters)
            ? item.chapters.map(chap => ({
                ...chap,
                chapterId:
                  typeof chap.chapterId === "object" && chap.chapterId !== null
                    ? (chap.chapterId as { _id: string })._id
                    : String(chap.chapterId),
              }))
            : [],
        }))
      : [],
    birthDate: u.birthDate,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    privacy: u.privacy,
    displaySettings: u.displaySettings,
    equippedDecorations: u.equippedDecorations,
  };
}

export default function UserBookmarksPage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";

  const { data, isSuccess } = useGetProfileByUsernameQuery(username, {
    skip: !username,
  });

  const userProfile =
    isSuccess && data?.success && data?.data
      ? transformUserToProfile(data.data)
      : null;

  if (!userProfile) return null;

  return (
    <div className="w-full animate-fade-in-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 min-h-[400px] flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[var(--border)]/60">
          <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Закладки {userProfile.username}
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Сохранённые тайтлы
            </p>
          </div>
        </div>
        <ProfileBookmarksGrid
          bookmarks={userProfile.bookmarks}
          readingHistory={userProfile.readingHistory}
          canEdit={false}
        />
      </div>
    </div>
  );
}
