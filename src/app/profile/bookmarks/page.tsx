"use client";

import { Bookmark } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { default as BookmarksSection } from "@/widgets/profile-bookmarks/ProfileBookmarks";

export default function ProfileBookmarksPage() {
  const { userProfile } = useProfile();

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
              Мои закладки
            </h2>
            <p className="text-[var(--muted-foreground)] text-sm">
              Все сохранённые тайтлы
            </p>
          </div>
        </div>
        <BookmarksSection
          bookmarks={userProfile.bookmarks}
          readingHistory={userProfile.readingHistory}
          showAll={true}
          showSectionHeader={false}
        />
      </div>
    </div>
  );
}
