import { UserProfile } from "@/types/user";
import { Calendar, Clock, UserCheck } from "lucide-react";

interface ProfileAdditionalInfoProps {
  userProfile: UserProfile;
}

export default function ProfileAdditionalInfo({ userProfile }: ProfileAdditionalInfoProps) {
  // Форматирование даты регистрации
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  console.log(userProfile)

  // Форматирование последнего входа
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Функция для отправки письма подтверждения email
  const handleSendVerificationEmail = () => {
    if (!userProfile.email) {
      console.error("Email не найден в профиле пользователя");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userProfile.email }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Письмо подтверждения отправлено");
        // Здесь можно показать уведомление пользователю
      } else {
        console.error("Ошибка отправки письма подтверждения:", data.message);
      }
    })
    .catch(error => {
      console.error("Ошибка сети при отправке письма подтверждения:", error);
    });
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
            className="px-4 py-2 bg-[var(--chart-1)] text-[var(--primary)] rounded-lg hover:bg-[var(--chart-1)]/90 transition-colors text-sm"
          >
            Отправить письмо подтверждения email
          </button>
        </div>
      )}
    </div>
  );
}
