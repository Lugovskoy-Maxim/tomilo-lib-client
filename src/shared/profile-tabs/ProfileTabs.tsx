"use client";

import { useState } from "react";
import { UserProfile } from "@/types/user";
import { BarChart3, Bookmark, Clock, Settings } from "lucide-react";

// Компоненты обзора
import ProfileAdditionalInfo from "@/shared/profile/ProfileAdditionalInfo";
import ProfileContent from "@/shared/profile/ProfileContent";

// Компоненты закладок и истории
import { default as BookmarksSection } from "@/widgets/profile-bookmarks/ProfileBookmarks";
import { default as ReadingHistorySection } from "@/widgets/profile-reading/ProfileReading";

// Компоненты настроек
import ProfileNotificationsSettings from "@/shared/profile/ProfileNotificationsSettings";
import ProfileReadingSettings from "@/shared/profile/ProfileReadingSettings";
import ProfileThemeSettings from "@/shared/profile/ProfileThemeSettings";
import ProfilePrivacySettings from "@/shared/profile/ProfilePrivacySettings";
import ProfileSecuritySettings from "@/shared/profile/ProfileSecuritySettings";

type ProfileTab = "overview" | "bookmarks" | "history" | "settings";

interface ProfileTabsProps {
  userProfile: UserProfile;
}

const tabs: {
  id: ProfileTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "overview" as ProfileTab,
    label: "Обзор",
    icon: BarChart3,
  },
  {
    id: "bookmarks" as ProfileTab,
    label: "Закладки",
    icon: Bookmark,
  },
  {
    id: "history" as ProfileTab,
    label: "История",
    icon: Clock,
  },
  {
    id: "settings" as ProfileTab,
    label: "Настройки",
    icon: Settings,
  },
];

export function ProfileTabs({ userProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  return (
    <div className="space-y-6">
      {/* Навигация по вкладкам */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Контент вкладок */}
      <div className="animate-fade-in">
        {/* Вкладка "Обзор" */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* <ProfileStats userProfile={userProfile} /> */}
            <ProfileAdditionalInfo userProfile={userProfile} />
            <ProfileContent userProfile={userProfile} />
          </div>
        )}

        {/* Вкладка "Закладки" */}
        {activeTab === "bookmarks" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Мои закладки</h2>
              <p className="text-[var(--muted-foreground)] mb-4">Все сохраненные вами манги</p>
              <BookmarksSection bookmarks={userProfile.bookmarks} showAll={true} />
            </div>
          </div>
        )}

        {/* Вкладка "История" */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">История чтения</h2>
              <p className="text-[var(--muted-foreground)] mb-4">Все прочитанные вами главы</p>
              <ReadingHistorySection readingHistory={userProfile.readingHistory} />
            </div>
          </div>
        )}

        {/* Вкладка "Настройки" */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Настройки уведомлений */}
            <ProfileNotificationsSettings userProfile={userProfile} />

            {/* Настройки чтения */}
            <ProfileReadingSettings userProfile={userProfile} />

            {/* Настройки внешнего вида */}
            <ProfileThemeSettings userProfile={userProfile} />

            {/* Настройки приватности */}
            <ProfilePrivacySettings userProfile={userProfile} />

            {/* Настройки безопасности */}
            <ProfileSecuritySettings userProfile={userProfile} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileTabs;
