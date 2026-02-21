import { UserProfile } from "@/types/user";
import { Calendar, Clock, Mail, UserCheck, Share2 } from "lucide-react";
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
const YANDEX_CLIENT_ID = "ffd24e1c16544069bc7a1e8c66316f37";

interface ProfileAdditionalInfoProps {
  userProfile: UserProfile;
}

export default function ProfileAdditionalInfo({ userProfile }: ProfileAdditionalInfoProps) {
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
  const [pendingVk, setPendingVk] = useState<{ code: string; redirect_uri: string } | null>(null);
  const [pendingYandex, setPendingYandex] = useState<{ access_token: string } | null>(null);

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
    async (code: string, redirect_uri: string, resolve?: "use_existing" | "link_here" | "merge") => {
      try {
        const result = await linkVk({ code, redirect_uri, resolve }).unwrap();
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
            data?: { conflict?: boolean; existingAccount?: LinkConflictExistingAccount };
            message?: string;
            errors?: Array<string | { message?: string }>;
          };
        })?.data;
        if (status === 409 && data?.data?.conflict && data?.data?.existingAccount) {
          setConflict({ provider: "vk", existingAccount: data.data.existingAccount });
          setPendingVk({ code, redirect_uri });
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
    async (access_token: string, resolve?: "use_existing" | "link_here" | "merge") => {
      try {
        const result = await linkYandex({ access_token, resolve }).unwrap();
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
          setPendingYandex({ access_token });
        } else {
          const msg = (err as { data?: { message?: string } })?.data?.message ?? "Не удалось привязать Яндекс.ID";
          toast.error(msg);
        }
      }
    },
    [linkYandex, authLogin, refetchProfile, toast],
  );

  const handleConflictUseExisting = () => {
    if (conflict?.provider === "vk" && pendingVk) {
      doLinkVk(pendingVk.code, pendingVk.redirect_uri, "use_existing");
    } else if (conflict?.provider === "yandex" && pendingYandex) {
      doLinkYandex(pendingYandex.access_token, "use_existing");
    }
  };
  const handleConflictLinkHere = () => {
    if (conflict?.provider === "vk" && pendingVk) {
      doLinkVk(pendingVk.code, pendingVk.redirect_uri, "link_here");
    } else if (conflict?.provider === "yandex" && pendingYandex) {
      doLinkYandex(pendingYandex.access_token, "link_here");
    }
  };
  const handleConflictMerge = () => {
    if (conflict?.provider === "vk" && pendingVk) {
      doLinkVk(pendingVk.code, pendingVk.redirect_uri, "merge");
    } else if (conflict?.provider === "yandex" && pendingYandex) {
      doLinkYandex(pendingYandex.access_token, "merge");
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
        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Зарегистрирован</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.createdAt ? formatRegistrationDate(userProfile.createdAt) : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-1)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Последний вход</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.updatedAt ? formatLastLogin(userProfile.updatedAt) : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-2)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Статус</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl bg-[var(--secondary)]/40 border border-[var(--border)]/50 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--chart-3)]" />
            <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">Email подтверждён</span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] text-right truncate">
            {userProfile.emailVerified === true ? "Да" : "Нет"}
          </span>
        </div>

        <div className="mt-4 mb-2 px-0.5">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Соцсети и авторизации</p>
          {Array.isArray(userProfile.linkedProviders) && userProfile.linkedProviders.length > 0 && (
            <p className="text-xs text-[var(--chart-2)] mt-0.5">
              Подключено:{" "}
              {(
                [
                  { id: "yandex" as const, label: "Яндекс.ID" },
                  { id: "vk" as const, label: "VK ID" },
                ] as const
              )
                .filter(
                  ({ id }) =>
                    userProfile.linkedProviders?.some(p => p?.toLowerCase() === id)
                )
                .map(({ label }) => label)
                .join(", ")}
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
            userProfile.linkedProviders.some(p => p?.toLowerCase() === id);
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

      {userProfile.emailVerified !== true && (
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
