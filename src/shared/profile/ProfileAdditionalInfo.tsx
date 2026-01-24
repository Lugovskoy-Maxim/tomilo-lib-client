import { UserProfile } from "@/types/user";
import { Calendar, Clock, UserCheck } from "lucide-react";
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
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-lg font-semibold text-[var(--muted-foreground)] mb-4">
        Дополнительная информация
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Зарегистрирован</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {userProfile.createdAt ? formatRegistrationDate(userProfile.createdAt) : "Не указана"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Последний вход</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {userProfile.updatedAt ? formatLastLogin(userProfile.updatedAt) : "Не указана"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Статус</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {userProfile.role === "admin" ? "Администратор" : "Пользователь"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Email подтвержден</span>
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {userProfile.emailVerified === true ? "Да" : "Нет"}
          </span>
        </div>
      </div>

      {/* Кнопка для отправки письма подтверждения email */}
      {userProfile.emailVerified !== true && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSendVerificationEmail}
            disabled={isCooldown || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              isCooldown || isLoading
                ? "bg-[var(--muted)] cursor-not-allowed text-[var(--primary)]"
                : "bg-[var(--chart-1)] text-[var(--primary)] hover:bg-[var(--chart-1)]/90"
            }`}
          >
            {isLoading
              ? "Отправка..."
              : isCooldown
                ? `Отправить повторно через ${cooldownTime} сек`
                : "Отправить письмо подтверждения email"}
          </button>
        </div>
      )}
    </div>
  );
}
