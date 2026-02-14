"use client";

import { useState } from "react";
import { UserProfile } from "@/types/user";
import { BarChart3, Bookmark, Clock, Package, Repeat, Settings } from "lucide-react";

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
import ProfileLocaleSettings from "@/shared/profile/ProfileLocaleSettings";
import ProfileInventory from "@/shared/profile/ProfileInventory";
import Link from "next/link";

type ProfileTab = "overview" | "bookmarks" | "history" | "inventory" | "exchanges" | "settings";

interface ProfileTabsProps {
  userProfile: UserProfile;
}

const tabs: {
  id: ProfileTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "overview" as ProfileTab, label: "О себе", icon: BarChart3 },
  { id: "bookmarks" as ProfileTab, label: "Закладки", icon: Bookmark },
  { id: "history" as ProfileTab, label: "История", icon: Clock },
  { id: "inventory" as ProfileTab, label: "Инвентарь", icon: Package },
  { id: "exchanges" as ProfileTab, label: "Обмены", icon: Repeat },
  { id: "settings" as ProfileTab, label: "Настройки", icon: Settings },
];

export function ProfileTabs({ userProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <nav className="w-full border-b border-[var(--border)] mb-4 sm:mb-6 overflow-x-auto overflow-y-hidden -mx-1 px-1" aria-label="Разделы профиля">
        <div className="flex flex-nowrap min-w-0 gap-0 sm:flex-wrap sm:gap-1 w-max sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 px-2 min-[360px]:px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-colors text-xs min-[360px]:text-sm border-b-2 -mb-[2px] ${
                  isActive
                    ? "text-[var(--primary)] border-[var(--primary)]"
                    : "text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Контент вкладок */}
      <div className="animate-fade-in">
        {/* Вкладка "Обзор": сверху информация, под ней закладки и история в одну строку */}
        {activeTab === "overview" && (
          <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
            <ProfileAdditionalInfo userProfile={userProfile} />
            <ProfileContent
              userProfile={userProfile}
              onShowBookmarks={() => setActiveTab("bookmarks")}
              onShowHistory={() => setActiveTab("history")}
            />
          </div>
        )}

        {/* Вкладка "Закладки" */}
        {activeTab === "bookmarks" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm min-h-[320px] sm:min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 shrink-0">
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    Мои закладки
                  </h2>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    Все сохраненные вами манги
                  </p>
                </div>
              </div>
              <BookmarksSection bookmarks={userProfile.bookmarks} readingHistory={userProfile.readingHistory} showAll={true} showSectionHeader={false} />
            </div>
          </div>
        )}

        {/* Вкладка "История" */}
        {activeTab === "history" && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm min-h-[320px] sm:min-h-[400px] flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    История чтения
                  </h2>
                  <p className="text-[var(--muted-foreground)] text-xs">
                    Все прочитанные вами главы
                  </p>
                </div>
              </div>
              <ReadingHistorySection readingHistory={userProfile.readingHistory} showAll={true} showSectionHeader={false} />
            </div>
          </div>
        )}

        {/* Вкладка "Инвентарь" */}
        {activeTab === "inventory" && (
          <div className="animate-fade-in-up">
            <ProfileInventory />
          </div>
        )}

        {/* Вкладка "Обмены" */}
        {activeTab === "exchanges" && (
          <div className="w-full animate-fade-in-up">
            <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
              <div className="flex justify-center mb-4 sm:mb-5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
                  <Repeat className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--primary)]" />
                </div>
              </div>
              <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Обмены</h2>
              <p className="text-[var(--muted-foreground)] max-w-md mx-auto mb-6 text-xs leading-relaxed">
                Здесь вы сможете обмениваться предметами и декорациями с другими пользователями. Раздел в разработке.
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Следите за обновлениями или загляните в{" "}
                <Link href="/tomilo-shop" className="text-[var(--primary)] hover:underline font-medium">
                  магазин
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* Вкладка "Настройки" */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 lg:gap-6 animate-fade-in-up">
            <ProfileNotificationsSettings userProfile={userProfile} />
            <ProfileDisplaySettings userProfile={userProfile} />
            <ProfileLocaleSettings userProfile={userProfile} />
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
