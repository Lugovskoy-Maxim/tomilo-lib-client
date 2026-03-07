"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Shield, Lock, Home, AlertTriangle, Calendar } from "lucide-react";
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
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Профиль скрыт
              </h2>
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
        <p className="text-[var(--foreground)] font-medium mb-2">{emptyStateMessage ?? "Профиль не найден"}</p>
        <Link
          href="/"
          className="text-sm text-[var(--primary)] hover:underline"
        >
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

        {/* Полоска профиля: всё в одну линию */}
        <div className="mb-4 sm:mb-5">
          <ProfileStrip
            userProfile={userProfile}
            onEdit={variant === "own" ? onEdit : undefined}
            onAvatarUpdate={variant === "own" ? onAvatarUpdate : undefined}
            isOwnProfile={variant === "own" || isOwnProfile}
            isPublicView={variant === "other"}
          />
        </div>

        {/* Один столбец контента */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 profile-shell-content">
          {userProfile?.deletedAt && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3 text-sm text-[var(--foreground)]">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium">Профиль удалён</p>
                <p className="text-[var(--muted-foreground)] mt-0.5">Данные учётной записи сохранены, но не используются.</p>
              </div>
            </div>
          )}
          {userProfile?.scheduledDeletionAt && !userProfile?.deletedAt && new Date(userProfile.scheduledDeletionAt).getTime() > Date.now() && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start gap-3 text-sm text-[var(--foreground)]">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium">Запланировано удаление профиля</p>
                <p className="text-[var(--muted-foreground)] mt-0.5">
                  Удаление запланировано на {new Date(userProfile.scheduledDeletionAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}. До этой даты владелец может отменить удаление в настройках.
                </p>
              </div>
            </div>
          )}
          {hasPrivacyNotice && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-[var(--foreground)]">
              Часть данных скрыта настройками приватности.
            </div>
          )}
          {variant === "admin" && adminControls && (
            <div className="shrink-0">
              {adminControls}
            </div>
          )}
          <div className="flex-1 min-h-0 min-w-0 rounded-2xl border border-[color-mix(in_oklch,var(--border)_70%,transparent)] overflow-hidden flex flex-col bg-[color-mix(in_oklch,var(--card)_88%,transparent)] dark:bg-[color-mix(in_oklch,var(--card)_58%,transparent)] backdrop-blur-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]">
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
