import { UserProfile } from "@/types/user";
import { Calendar, Clock, Mail, UserCheck, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLinkVkMutation, useLinkYandexMutation } from "@/store/api/authApi";
import type { AuthResponse, LinkConflictExistingAccount } from "@/types/auth";
import type { ApiResponseDto } from "@/types/api";
import type { SocialProvider } from "@/shared/modal/LinkConflictModal";
import LinkConflictModal from "@/shared/modal/LinkConflictModal";
import { getVkAuthUrl } from "@/lib/vk-auth-url";

const YANDEX_LINK_MODE_KEY = "yandex_link_mode";

/** Полезная нагрузка для привязки VK (из callback или для повторного запроса с resolve). */
type PendingVkPayload = {
  code: string;
  redirect_uri: string;
  code_verifier?: string;
  device_id?: string;
  state?: string;
};
const YANDEX_CLIENT_ID = "ffd24e1c16544069bc7a1e8c66316f37";

interface ProfileAdditionalInfoProps {
  userProfile: UserProfile;
  /** Публичный просмотр (чужой профиль) — скрывает приватные данные */
  isPublicView?: boolean;
}

export default function ProfileAdditionalInfo({ userProfile, isPublicView = false }: ProfileAdditionalInfoProps) {
  const toast = useToast();
  const { user: currentUser, login: authLogin, refetchProfile } = useAuth();
  const [linkVk, { isLoading: isLinkingVk }] = useLinkVkMutation();
  const [linkYandex, { isLoading: isLinkingYandex }] = useLinkYandexMutation();

  const isOwnProfile =
    !!currentUser &&
    (currentUser.id === userProfile._id ||
      currentUser._id === userProfile._id ||
      currentUser.username === userProfile.username);

  // Конфликт привязки (409): другой пользователь уже привязал эту соцсеть
  const [conflict, setConflict] = useState<{
    provider: SocialProvider;
    existingAccount: LinkConflictExistingAccount;
  } | null>(null);
  const [pendingVk, setPendingVk] = useState<PendingVkPayload | null>(null);
  const [, setPendingYandex] = useState<{ access_token: string } | null>(null);

  const isLinking = isLinkingVk || isLinkingYandex;

  // Состояние для таймера
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(60);

  // Форматирование даты регистрации
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Форматирование последнего входа
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Состояние для отслеживания загрузки
  const [isLoading, setIsLoading] = useState(false);

  // Функция для отправки письма подтверждения email
  const handleSendVerificationEmail = () => {
    if (!userProfile.email) {
      toast.error("Email не найден в профиле пользователя");
      return;
    }

    if (isCooldown) {
      toast.warning(`Пожалуйста, подождите ${cooldownTime} секунд перед повторной отправкой`);
      return;
    }

    // Проверяем, не выполняется ли уже запрос
    if (isLoading) {
      toast.warning("Письмо уже отправляется, пожалуйста, подождите");
      return;
    }

    // Устанавливаем состояние загрузки
    setIsLoading(true);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/send-verification-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userProfile.email }),
      },
    )
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          toast.success("Письмо подтверждения отправлено на ваш email");
          // Запуск таймера перезарядки
          startCooldown();
        } else {
          toast.error(data.message || "Ошибка отправки письма подтверждения");
        }
      })
      .catch(error => {
        toast.error(`Ошибка сети при отправке письма подтверждения: ${error.message} `);
      })
      .finally(() => {
        // Сбрасываем состояние загрузки после завершения запроса
        setIsLoading(false);
      });
  };

  // Функция для запуска таймера перезарядки
  const startCooldown = () => {
    setIsCooldown(true);
    setCooldownTime(60);

    const timer = setInterval(() => {
      setCooldownTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsCooldown(false);
          return 60;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const doLinkVk = useCallback(
    async (payload: PendingVkPayload, resolve?: "use_existing" | "link_here" | "merge") => {
      try {
        const result = await linkVk({
          code: payload.code,
          redirect_uri: payload.redirect_uri,
          code_verifier: payload.code_verifier,
          device_id: payload.device_id,
          state: payload.state,
          resolve,
        }).unwrap();
        setConflict(null);
        setPendingVk(null);
        if (resolve === "use_existing" && result?.data && "access_token" in result.data) {
          authLogin(result as ApiResponseDto<AuthResponse>);
        }
        refetchProfile();
        toast.success("VK ID успешно привязан");
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const data = (err as {
          data?: {
            data?: {
              conflict?: boolean;
              existingAccount?: LinkConflictExistingAccount;
              provider?: "vk" | "vk_id" | "yandex";
            };
            message?: string;
            errors?: Array<string | { message?: string }>;
          };
        })?.data;
        if (status === 409 && data?.data?.conflict && data?.data?.existingAccount) {
          const provider = data.data.provider === "vk_id" ? "vk_id" : data.data.provider === "yandex" ? "yandex" : "vk";
          const acc = data.data.existingAccount;
          setConflict({
            provider,
            existingAccount: { id: acc?.id ?? "", username: acc?.username ?? "другой пользователь" },
          });
          setPendingVk(payload);
        } else {
          const firstError = data?.errors?.[0];
          const detailMsg = typeof firstError === "object" ? firstError?.message : firstError;
          const msg = detailMsg ?? data?.message ?? "Не удалось привязать VK ID";
          const isServerError = status && status >= 500;
          const isCodeExpired =
            status === 401 && (detailMsg?.toLowerCase().includes("invalid") || detailMsg?.toLowerCase().includes("expired"));
          const fullMsg = isServerError
            ? "Ошибка сервера при привязке VK. Попробуйте позже или повторите вход через VK."
            : isCodeExpired
              ? "Код авторизации недействителен или истёк. Закройте окно VK и нажмите «Привязать VK» снова."
              : msg;
          toast.error(fullMsg);
          if (isCodeExpired) setPendingVk(null);
        }
      }
    },
    [linkVk, authLogin, refetchProfile, toast],
  );

  const doLinkYandex = useCallback(
    async (access_token: string | undefined, resolve?: "use_existing" | "link_here" | "merge") => {
      try {
        const result = await linkYandex(
          resolve ? { resolve } : { access_token: access_token! },
        ).unwrap();
        setConflict(null);
        setPendingYandex(null);
        if (resolve === "use_existing" && result?.data && "access_token" in result.data) {
          authLogin(result as ApiResponseDto<AuthResponse>);
        }
        refetchProfile();
        toast.success("Яндекс.ID успешно привязан");
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        const data = (err as { data?: { data?: { conflict?: boolean; existingAccount?: LinkConflictExistingAccount } } })?.data;
        if (status === 409 && data?.data?.conflict && data?.data?.existingAccount) {
          setConflict({ provider: "yandex", existingAccount: data.data.existingAccount });
          setPendingYandex(access_token ? { access_token } : null);
        } else {
          const msg = (err as { data?: { message?: string } })?.data?.message ?? "Не удалось привязать Яндекс.ID";
          toast.error(msg);
        }
      }
    },
    [linkYandex, authLogin, refetchProfile, toast],
  );

  const isVkConflict = conflict?.provider === "vk" || conflict?.provider === "vk_id";
  const handleConflictUseExisting = () => {
    if (isVkConflict && pendingVk) {
      doLinkVk(pendingVk, "use_existing");
    } else if (conflict?.provider === "yandex") {
      doLinkYandex(undefined, "use_existing");
    }
  };
  const handleConflictLinkHere = () => {
    if (isVkConflict && pendingVk) {
      doLinkVk(pendingVk, "link_here");
    } else if (conflict?.provider === "yandex") {
      doLinkYandex(undefined, "link_here");
    }
  };
  const handleConflictMerge = () => {
    if (isVkConflict && pendingVk) {
      doLinkVk(pendingVk, "merge");
    } else if (conflict?.provider === "yandex") {
      doLinkYandex(undefined, "merge");
    }
  };

  const redirectToVkLink = async () => {
    try {
      const url = await getVkAuthUrl(true);
      window.location.href = url;
    } catch {
      toast.error("Не удалось перейти к авторизации VK");
    }
  };

  const openYandexLinkPopup = () => {
    try {
      sessionStorage.setItem(YANDEX_LINK_MODE_KEY, "1");
      const redirectUri =
        typeof window !== "undefined" ? `${window.location.origin}/auth/yandex` : "https://tomilo-lib.ru/auth/yandex";
      const url = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.open(url, "yandex_link", "width=500,height=600,scrollbars=yes");
    } catch {
      toast.error("Не удалось открыть окно авторизации Яндекса");
    }
  };

  // Получить токен после OAuth Яндекса в popup (postMessage от /auth/yandex). VK привязка — полный редирект, как при логине.
  useEffect(() => {
    if (!isOwnProfile) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "YANDEX_LINK_TOKEN" && e.data?.access_token) {
        setPendingYandex({ access_token: e.data.access_token });
        doLinkYandex(e.data.access_token);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isOwnProfile, doLinkYandex]);

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-[var(--border)]/60">
        <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
          <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            О аккаунте
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">Регистрация и статус</p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Дата регистрации - публичная */}
        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Зарегистрирован</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.createdAt ? formatRegistrationDate(userProfile.createdAt) : "—"}
          </span>
        </div>

        {/* Последний вход - только для своего профиля */}
        {!isPublicView && (
          <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-1)]" />
              <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Последний вход</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
              {userProfile.updatedAt ? formatLastLogin(userProfile.updatedAt) : "—"}
            </span>
          </div>
        )}

        {/* Статус - публичный */}
        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-2)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Статус</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>

        {/* Email подтверждён - только для своего профиля */}
        {!isPublicView && (
          <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-3)]" />
              <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Email подтверждён</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
              {userProfile.emailVerified === true ? "Да" : "Нет"}
            </span>
          </div>
        )}

        {/* Ссылки на соцсети пользователя */}
        {userProfile.socialLinks && (userProfile.socialLinks.telegram || userProfile.socialLinks.discord || userProfile.socialLinks.vk) && (
          <>
            <div className="mt-4 mb-2 px-0.5">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Контакты</p>
            </div>
            {userProfile.socialLinks.telegram && (
              <a
                href={`https://t.me/${userProfile.socialLinks.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/30 min-w-0 hover:bg-[#229ED9]/20 transition-colors group"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#229ED9]" />
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">Telegram</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-[#229ED9] truncate">@{userProfile.socialLinks.telegram.replace(/^@/, "")}</span>
                  <ExternalLink className="w-3 h-3 text-[#229ED9] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </a>
            )}
            {userProfile.socialLinks.discord && (
              <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">Discord</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#5865F2] truncate">{userProfile.socialLinks.discord}</span>
              </div>
            )}
            {userProfile.socialLinks.vk && (
              <a
                href={`https://vk.com/${userProfile.socialLinks.vk}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[#0077FF]/10 border border-[#0077FF]/30 min-w-0 hover:bg-[#0077FF]/20 transition-colors group"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0077FF]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.033-1.49-1.172-1.744-1.172-.356 0-.457.102-.457.592v1.561c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.58 4 8.097c0-.254.102-.492.593-.492h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.492.763-.492h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/>
                  </svg>
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">VK</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-[#0077FF] truncate">{userProfile.socialLinks.vk}</span>
                  <ExternalLink className="w-3 h-3 text-[#0077FF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </a>
            )}
          </>
        )}

        {/* Соцсети и авторизации - только для своего профиля */}
        {!isPublicView && (
          <>
            <div className="mt-4 mb-2 px-0.5">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Соцсети и авторизации</p>
              {Array.isArray(userProfile.linkedProviders) && userProfile.linkedProviders.length > 0 && (
                <p className="text-xs text-[var(--chart-2)] mt-0.5">
                  Подключено:{" "}
                  {[
                    ...(userProfile.linkedProviders?.some(p => p?.toLowerCase() === "yandex") ? ["Яндекс.ID"] : []),
                    ...(userProfile.linkedProviders?.some(p => p?.toLowerCase() === "vk" || p?.toLowerCase() === "vk_id") ? ["VK ID"] : []),
                  ].join(", ")}
                </p>
              )}
            </div>
            {(
              [
                { id: "yandex" as const, label: "Яндекс.ID", color: "text-[#FC3F1D]" },
                { id: "vk" as const, label: "VK ID", color: "text-[#0077FF]" },
              ] as const
            ).map(({ id, label, color }) => {
              const linked =
                Array.isArray(userProfile.linkedProviders) &&
                userProfile.linkedProviders.some(p => p?.toLowerCase() === id || (id === "vk" && p?.toLowerCase() === "vk_id"));
              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <Share2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
                    <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {linked ? (
                      <span className="text-xs sm:text-sm font-medium text-[var(--chart-2)] truncate">
                        Подключено
                      </span>
                    ) : isOwnProfile ? (
                      <button
                        type="button"
                        onClick={id === "vk" ? redirectToVkLink : openYandexLinkPopup}
                        disabled={isLinking}
                        className="text-xs sm:text-sm font-medium text-[var(--chart-1)] hover:underline truncate disabled:opacity-50"
                      >
                        Подключить
                      </button>
                    ) : (
                      <span className="text-xs sm:text-sm font-medium text-[var(--muted-foreground)] truncate">
                        Не подключено
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <LinkConflictModal
        isOpen={!!conflict}
        onClose={() => {
          setConflict(null);
          setPendingVk(null);
          setPendingYandex(null);
        }}
        provider={conflict?.provider ?? "vk"}
        existingAccount={conflict?.existingAccount ?? { id: "", username: "" }}
        onUseExisting={handleConflictUseExisting}
        onLinkHere={handleConflictLinkHere}
        onMerge={handleConflictMerge}
        isLoading={isLinking}
      />

      {isOwnProfile && userProfile.emailVerified !== true && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={isCooldown || isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isCooldown || isLoading
                ? "bg-[var(--muted)] cursor-not-allowed text-[var(--muted-foreground)]"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            }`}
          >
            {isLoading
              ? "Отправка..."
              : isCooldown
                ? `Повторно через ${cooldownTime} сек`
                : "Отправить письмо подтверждения"}
          </button>
        </div>
      )}
    </div>
  );
}
