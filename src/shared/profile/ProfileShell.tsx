"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  Lock,
  Home,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { UserProfile } from "@/types/user";
import { Footer, Header } from "@/widgets";
import ProfileStrip from "@/shared/profile/ProfileStrip";
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
  /** Текст вместо «Профиль не найден», когда userProfile === null (например, «Профиль скрыт») */
  emptyStateMessage?: string;
  /** Вариант пустого состояния: "private" — отдельный UI для приватного профиля */
  emptyStateVariant?: "not_found" | "private";
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
  emptyStateMessage,
  emptyStateVariant = "not_found",
}: ProfileShellProps) {
  const router = useRouter();

  const topBarBack = () => {
    if (variant === "own") router.back();
    else if (variant === "other") window.history.back();
    else router.back();
  };

  const renderEmptyState = () => {
    if (emptyStateVariant === "private") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-8 shadow-lg shadow-[var(--border)]/10 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                <Lock className="h-8 w-8 shrink-0" strokeWidth={1.5} aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Профиль скрыт</h2>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-6">
                Владелец профиля ограничил доступ. Вы можете вернуться назад или на главную.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={topBarBack}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  Назад
                </button>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity font-medium"
                >
                  <Home className="h-4 w-4 shrink-0" />
                  На главную
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[50vh] px-4">
        <p className="text-[var(--foreground)] font-medium mb-2">
          {emptyStateMessage ?? "Профиль не найден"}
        </p>
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
          На главную
        </Link>
      </div>
    );
  };

  const content = isLoading ? (
    <div className="flex flex-1 flex-col min-h-0">
      <LoadingState />
    </div>
  ) : !userProfile ? (
    renderEmptyState()
  ) : (
    <div className="relative min-h-[40vh] sm:min-h-[44vh] flex flex-1 flex-col pt-20 max-[380px]:pt-[4.5rem] sm:pt-44 bg-transparent">
      <div className="relative z-10 w-full mx-auto px-3 min-[380px]:px-4 sm:px-8 lg:px-12 max-w-6xl min-w-0 overflow-x-hidden flex flex-1 flex-col pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-2">
        {/* Верхняя панель: назад + контекстная ссылка */}
        <div className="flex flex-wrap items-stretch gap-2 py-2 sm:flex-nowrap sm:items-center sm:justify-between sm:gap-3 sm:py-4">
          <button
            type="button"
            onClick={topBarBack}
            className="profile-glass-toolbar flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklch,var(--accent)_55%,transparent)] transition-colors sm:min-h-0 sm:rounded-xl sm:px-3"
            aria-label="Назад"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
            Назад
          </button>
          <div className="flex w-full flex-wrap items-center justify-stretch gap-2 empty:hidden sm:ml-auto sm:w-auto sm:justify-end">
            {variant === "admin" && (
              <Link
                href="/admin"
                className="profile-glass-toolbar flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/15 transition-colors sm:min-h-0 sm:flex-none sm:rounded-xl"
              >
                <Shield className="w-4 h-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Админка</span>
              </Link>
            )}
            {(variant === "admin" || (variant === "other" && showMyProfileLink)) && (
              <Link
                href="/profile"
                className="profile-glass-toolbar flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[color-mix(in_oklch,var(--accent)_50%,transparent)] transition-colors sm:min-h-0 sm:flex-none sm:rounded-xl"
              >
                <UserIcon className="w-4 h-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Мой профиль</span>
              </Link>
            )}
            {variant === "own" && showAdminLink && (
              <Link
                href="/admin"
                className="profile-glass-toolbar flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/15 transition-colors sm:min-h-0 sm:flex-none sm:rounded-xl"
              >
                <Shield className="w-4 h-4 shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Админка</span>
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

        {/* Полоска профиля: всё в одну линию */}
        <div className="mb-5 sm:mb-7">
          <ProfileStrip
            userProfile={userProfile}
            onEdit={variant === "own" ? onEdit : undefined}
            onAvatarUpdate={variant === "own" ? onAvatarUpdate : undefined}
            isOwnProfile={variant === "own" || isOwnProfile}
            isPublicView={variant === "other"}
          />
        </div>

        {/* Один столбец контента */}
        <div className="flex-1 min-h-0 flex flex-col gap-6 sm:gap-8 profile-shell-content">
          {userProfile?.deletedAt && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3 text-sm text-[var(--foreground)]">
              <AlertTriangle
                className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
                aria-hidden
              />
              <div>
                <p className="font-medium">Профиль удалён</p>
                <p className="text-[var(--muted-foreground)] mt-0.5">
                  Данные учётной записи сохранены, но не используются.
                </p>
              </div>
            </div>
          )}
          {userProfile?.scheduledDeletionAt &&
            !userProfile?.deletedAt &&
            new Date(userProfile.scheduledDeletionAt).getTime() > Date.now() && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3 text-sm text-[var(--foreground)]">
                <Calendar
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                  aria-hidden
                />
                <div>
                  <p className="font-medium">Запланировано удаление профиля</p>
                  <p className="text-[var(--muted-foreground)] mt-0.5">
                    Удаление запланировано на{" "}
                    {new Date(userProfile.scheduledDeletionAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    . До этой даты владелец может отменить удаление в настройках.
                  </p>
                </div>
              </div>
            )}
          {hasPrivacyNotice && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-[var(--foreground)]">
              Часть данных скрыта настройками приватности.
            </div>
          )}
          {variant === "admin" && adminControls && <div className="shrink-0">{adminControls}</div>}
          <div className="profile-shell-main-panel flex-1 min-h-0 min-w-0 rounded-2xl overflow-hidden flex flex-col">
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
  );

  const wrapWithProvider = variant === "own" && profileContextValue;

  return (
    <main className="relative min-h-screen flex flex-col min-w-0 overflow-x-hidden">
      {/* Глобальный фон профиля: во всю ширину экрана, фиксированный при скролле */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Image
          src="/user/banner.jpg"
          alt=""
          fill
          unoptimized
          className="object-cover object-center"
        />
        {backgroundUrl && (
          <Image
            src={backgroundUrl}
            alt=""
            fill
            unoptimized
            className="object-cover object-center"
          />
        )}
      </div>
      <div className="relative z-10 flex flex-col flex-1 min-h-0 bg-transparent">
        <Header />
        {wrapWithProvider ? (
          <ProfileProvider value={profileContextValue}>{content}</ProfileProvider>
        ) : (
          content
        )}
        <Footer />
      </div>
    </main>
  );
}
