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
import ProfilePrivacySettings from "@/shared/profile/ProfilePrivacySettings";
import ProfileSecuritySettings from "@/shared/profile/ProfileSecuritySettings";
import ProfileDisplaySettings from "@/shared/profile/ProfileDisplaySettings";

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
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Навигация по вкладкам - Pill Style */}
      <div className="glass rounded-2xl border border-[var(--border)] p-2 shadow-lg">
        <div className="relative flex items-center justify-between gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                  isActive
                    ? "text-[var(--primary-foreground)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]/50"
                }`}
              >
                {/* Active background pill */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--chart-1)] rounded-xl shadow-lg shadow-[var(--primary)]/25 transition-all duration-300" />
                )}
                
                {/* Icon and label */}
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="relative z-10 truncate max-w-full">{tab.label}</span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary-foreground)]/50 sm:hidden" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Контент вкладок */}
      <div className="animate-fade-in">
        {/* Вкладка "Обзор" */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-fade-in-up">
            <ProfileAdditionalInfo userProfile={userProfile} />
            <ProfileContent userProfile={userProfile} />
          </div>
        )}

        {/* Вкладка "Закладки" */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="glass rounded-2xl p-4 sm:p-6 border border-[var(--border)] min-h-[400px] flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)]">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                    Мои закладки
                  </h2>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    Все сохраненные вами манги
                  </p>
                </div>
              </div>
              <BookmarksSection bookmarks={userProfile.bookmarks} showAll={true} showSectionHeader={false} />
            </div>
          </div>
        )}

        {/* Вкладка "История" */}
        {activeTab === "history" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="glass rounded-2xl p-4 sm:p-6 border border-[var(--border)] min-h-[400px] flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--chart-2)] to-[var(--chart-3)]">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                    История чтения
                  </h2>
                  <p className="text-[var(--muted-foreground)] text-sm">
                    Все прочитанные вами главы
                  </p>
                </div>
              </div>
              <ReadingHistorySection readingHistory={userProfile.readingHistory} showAll={true} showSectionHeader={false} />
            </div>
          </div>
        )}

        {/* Вкладка "Настройки" */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 animate-fade-in-up">
            <ProfileNotificationsSettings userProfile={userProfile} />
            <ProfileDisplaySettings userProfile={userProfile} />
            <ProfileReadingSettings userProfile={userProfile} />
            <ProfilePrivacySettings userProfile={userProfile} />
            <div className="lg:col-span-2">
              <ProfileSecuritySettings userProfile={userProfile} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileTabs;
