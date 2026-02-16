import { UserProfile } from "@/types/user";
import { ProfileBookmarksLibrary, ReadingHistorySection } from "@/widgets";

interface ProfileContentProps {
  userProfile: UserProfile;
  /** Ссылка «Вся манга» (для публичного профиля — /user/username/bookmarks) */
  allBookmarksHref?: string;
  /** Ссылка «Вся история» (для публичного профиля — /user/username/history) */
  historyHref?: string;
  /** При клике «Все тайтлы» переключить на вкладку закладок (без смены URL) */
  onShowBookmarks?: () => void;
  /** При клике «Вся история» переключить на вкладку истории (без смены URL) */
  onShowHistory?: () => void;
  /** Сообщение, если блок закладок скрыт приватностью */
  hiddenBookmarksMessage?: string;
  /** Сообщение, если блок истории скрыт приватностью */
  hiddenHistoryMessage?: string;
  /** Кастомный текст пустого состояния для закладок */
  bookmarksEmptyStateMessage?: string;
}

export default function ProfileContent({
  userProfile,
  allBookmarksHref,
  historyHref = "/profile",
  onShowBookmarks,
  onShowHistory,
  hiddenBookmarksMessage,
  hiddenHistoryMessage,
  bookmarksEmptyStateMessage,
}: ProfileContentProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-6 items-stretch max-w-4xl min-w-0">
      {hiddenBookmarksMessage ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--foreground)] mb-2">Закладки</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{hiddenBookmarksMessage}</p>
        </div>
      ) : (
        <ProfileBookmarksLibrary
          bookmarks={userProfile.bookmarks}
          readingHistory={userProfile.readingHistory}
          allBookmarksHref={onShowBookmarks ? undefined : (allBookmarksHref ?? "/profile/bookmarks")}
          onShowAllBookmarks={onShowBookmarks}
          maxItems={10}
          emptyStateMessage={bookmarksEmptyStateMessage}
        />
      )}
      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-6 shadow-sm min-h-[240px] sm:min-h-[280px] flex flex-col">
        {hiddenHistoryMessage ? (
          <div className="flex flex-1 items-center justify-center text-center px-2">
            <p className="text-sm text-[var(--muted-foreground)]">{hiddenHistoryMessage}</p>
          </div>
        ) : (
          <ReadingHistorySection
            readingHistory={userProfile.readingHistory}
            historyHref={onShowHistory ? undefined : historyHref}
            onShowAllHistory={onShowHistory}
          />
        )}
      </div>
    </div>
  );
}
