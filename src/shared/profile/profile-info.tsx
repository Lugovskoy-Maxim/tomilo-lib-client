import { UserProfile } from "@/types/user";

interface UserInfoProps {
  userProfile: UserProfile;
}

export default function UserInfo({ userProfile }: UserInfoProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
      <div className="mb-4 ml-40 lg:mb-0">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">
          {userProfile.username}
        </h1>
        <div className="flex items-center space-x-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              userProfile.role === "admin"
                ? "bg-red-500/10 text-red-600"
                : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {userProfile.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>
      </div>

      <UserStats userProfile={userProfile} />
    </div>
  );
}

function UserStats({ userProfile }: { userProfile: UserProfile }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
      <div className="flex items-center space-x-1">
        <EmailIcon />
        <span className="text-xs">{userProfile.email}</span>
      </div>
      <div className="flex items-center space-x-1">
        <CalendarIcon />
        <span className="text-xs">
          С {new Date(userProfile.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>
      <div className="flex items-center space-x-1">
        <BookmarkIcon />
        <span className="text-xs">{userProfile.bookmarks.length} закладок</span>
      </div>
      <div className="flex items-center space-x-1">
        <HistoryIcon />
        <span className="text-xs">{userProfile.readingHistory.length} в истории</span>
      </div>
    </div>
  );
}

// Иконки как отдельные компоненты для читаемости
function EmailIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}