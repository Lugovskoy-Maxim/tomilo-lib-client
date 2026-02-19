import { UserProfile } from "@/types/user";
import { Calendar, Clock, Mail, UserCheck, Share2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
interface ProfileAdditionalInfoProps {
  userProfile: UserProfile;
}

export default function ProfileAdditionalInfo({ userProfile }: ProfileAdditionalInfoProps) {
  const toast = useToast();
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

        <p className="text-xs font-medium text-[var(--muted-foreground)] mt-4 mb-2 px-0.5">Соцсети и авторизации</p>
        {(
          [
            { id: "yandex", label: "Яндекс.ID", color: "text-[#FC3F1D]" },
            { id: "vk", label: "VK ID", color: "text-[#0077FF]" },
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
              <span
                className={`text-xs sm:text-sm font-medium text-right truncate ${
                  linked ? "text-[var(--chart-2)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                {linked ? "Подключено" : "Не подключено"}
              </span>
            </div>
          );
        })}
      </div>

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
