"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Shield } from "lucide-react";
import { UserProfile } from "@/types/user";
import { Footer, Header } from "@/widgets";
import ProfileSidebar from "@/shared/profile/ProfileSidebar";
import ProfileTabs, { type BreadcrumbItem } from "@/shared/profile-tabs/ProfileTabs";
import type { ProfileTab } from "@/shared/profile-tabs/profileTabConfig";
import { ProfileProvider } from "@/shared/profile/ProfileContext";
import Breadcrumbs from "@/shared/breadcrumbs/breadcrumbs";
import LoadingState from "@/shared/profile/ProfileLoading";

export type ProfileVariant = "own" | "other" | "admin";

export interface ProfileShellTopBar {
  onBack?: () => void;
  myProfileLink?: boolean;
  adminLink?: boolean;
}

export interface ProfileShellProps {
  variant: ProfileVariant;
  userProfile: UserProfile | null;
  isLoading?: boolean;
  backgroundUrl: string;
  /** Только для variant="own": контекст профиля */
  profileContextValue?: {
    userProfile: UserProfile | null;
    isLoading: boolean;
    authLoading: boolean;
    handleAvatarUpdate: (newAvatarUrl: string) => void;
  };
  /** Только для variant="own": редактирование и аватар */
  onEdit?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  /** Только для variant="other": свой ли это профиль (текущего юзера) */
  isOwnProfile?: boolean;
  /** Только для variant="other": закладки скрыты приватностью */
  isBookmarksRestricted?: boolean;
  /** Только для variant="other": история скрыта приватностью */
  isHistoryRestricted?: boolean;
  /** Есть предупреждение о приватности (чужой профиль) */
  hasPrivacyNotice?: boolean;
  /** Скрыть эти вкладки в ProfileTabs */
  hideTabs?: ProfileTab[];
  /** Префикс хлебных крошек для вкладок */
  breadcrumbPrefix?: BreadcrumbItem[] | null;
  /** Только для variant="admin": блок управления (роль, бан, баланс и т.д.) */
  adminControls?: React.ReactNode;
  /** Только для variant="admin": хлебные крошки страницы */
  breadcrumbs?: { name: string; href?: string; isCurrent?: boolean }[];
  /** Для variant="own": показывать ссылку на админку (если пользователь — админ) */
  showAdminLink?: boolean;
  /** Для variant="other": показывать ссылку «Мой профиль» (если пользователь авторизован) */
  showMyProfileLink?: boolean;
  /** Дочерние элементы не используются; контент формируется внутри оболочки */
  children?: never;
}

export default function ProfileShell({
  variant,
  userProfile,
  isLoading = false,
  backgroundUrl,
  profileContextValue,
  onEdit,
  onAvatarUpdate,
  isOwnProfile = false,
  isBookmarksRestricted = false,
  isHistoryRestricted = false,
  hasPrivacyNotice = false,
  hideTabs,
  breadcrumbPrefix,
  adminControls,
  breadcrumbs,
  showAdminLink = false,
  showMyProfileLink = true,
}: ProfileShellProps) {
  const router = useRouter();

  const topBarBack = () => {
    if (variant === "own") router.back();
    else if (variant === "other") window.history.back();
    else router.back();
  };

  const content = isLoading ? (
    <div className="flex flex-1 flex-col min-h-0">
      <LoadingState />
    </div>
  ) : !userProfile ? (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] px-4">
      <p className="text-[var(--foreground)] font-medium mb-2">Профиль не найден</p>
      <Link
        href="/"
        className="text-sm text-[var(--primary)] hover:underline"
      >
        На главную
      </Link>
    </div>
  ) : (
    <div
      className="relative min-h-[40vh] sm:min-h-[44vh] flex flex-1 flex-col bg-[var(--background)] pt-24 sm:pt-44 bg-no-repeat bg-top"
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "100% auto",
        backgroundPosition: "top center",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, var(--background) 65%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full mx-auto px-3 min-[360px]:px-4 sm:px-6 max-w-6xl min-w-0 overflow-x-hidden flex flex-1 flex-col">
        {/* Верхняя панель: назад + контекстная ссылка */}
        <div className="flex items-center justify-between gap-3 py-3">
          <button
            type="button"
            onClick={topBarBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--foreground)] bg-[var(--card)]/95 hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
            aria-label="Назад"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            {variant === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-[var(--card)]/95 hover:bg-red-500/10 border border-[var(--border)] transition-colors"
              >
                <Shield className="w-4 h-4 shrink-0" />
                Админка
              </Link>
            )}
            {(variant === "admin" || (variant === "other" && showMyProfileLink)) && (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--foreground)] bg-[var(--card)]/95 hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                Мой профиль
              </Link>
            )}
            {variant === "own" && showAdminLink && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-[var(--card)]/95 hover:bg-red-500/10 border border-[var(--border)] transition-colors"
              >
                <Shield className="w-4 h-4 shrink-0" />
                Админка
              </Link>
            )}
          </div>
        </div>

        {/* Хлебные крошки только для админки */}
        {variant === "admin" && breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-3">
            <Breadcrumbs items={breadcrumbs} className="text-sm" />
          </div>
        )}

        {/* Одна карточка: сайдбар + контент */}
        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch lg:items-start flex-1 min-h-0">
            <aside className="lg:w-60 xl:w-64 lg:shrink-0 lg:sticky lg:top-4">
              <ProfileSidebar
                userProfile={userProfile}
                onEdit={variant === "own" ? onEdit : undefined}
                onAvatarUpdate={variant === "own" ? onAvatarUpdate : undefined}
                isOwnProfile={variant === "own" || isOwnProfile}
                isPublicView={variant === "other"}
              />
            </aside>
            <div className="flex-1 min-w-0 flex flex-col gap-4 profile-shell-content">
              {hasPrivacyNotice && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-[var(--foreground)]">
                  Часть данных скрыта настройками приватности.
                </div>
              )}
              {variant === "admin" && adminControls && (
                <div className="shrink-0">
                  {adminControls}
                </div>
              )}
              <div className="flex-1 min-h-0 min-w-0">
                <ProfileTabs
                  userProfile={userProfile}
                  breadcrumbPrefix={breadcrumbPrefix ?? undefined}
                  hideTabs={hideTabs}
                  isPublicView={variant === "other"}
                  isBookmarksRestricted={isBookmarksRestricted}
                  isHistoryRestricted={isHistoryRestricted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const wrapWithProvider = variant === "own" && profileContextValue;

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] min-w-0 overflow-x-hidden">
      <Header />
      {wrapWithProvider ? (
        <ProfileProvider value={profileContextValue}>
          {content}
        </ProfileProvider>
      ) : (
        content
      )}
      <Footer />
    </main>
  );
}
