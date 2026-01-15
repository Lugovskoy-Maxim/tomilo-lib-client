import { UserProfile } from "@/types/user";
import { BookOpen, Clock, Star, Trophy, CircleDollarSign } from "lucide-react";

interface ProfileStatsProps {
  userProfile: UserProfile;
}

export default function ProfileStats({ userProfile }: ProfileStatsProps) {
  // Рассчитываем статистику
  const totalBookmarks = userProfile.bookmarks?.length || 0;
  const totalChaptersRead =
    userProfile.readingHistory?.reduce((total, item) => {
      return total + (item.chapters?.length || 0);
    }, 0) || 0;

  const level = userProfile.level || 0;

  const experience = userProfile.experience || 0;

  const balance = userProfile.balance || 0;

  // Форматирование времени чтения (примерное, предполагаем 2 минуты на главу)
  const formatReadingTime = (chapters: number) => {
    const minutes = chapters * 2; // Предполагаем 2 минуты на главу
    if (minutes < 60) {
      return `${minutes} мин`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return `${days} д ${hours} ч`;
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 py-4">
        {/* Уровень */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Уровень</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">{level}</div>
        </div>

        {/* Опыт */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Опыт</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">{experience}</div>
        </div>

        {/* Баланс */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <CircleDollarSign className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Баланс</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">{balance}</div>
        </div>

        {/* Прочитанные главы */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Глав</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">{totalChaptersRead}</div>
        </div>

        {/* Время чтения */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Время</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">
            {formatReadingTime(totalChaptersRead)}
          </div>
        </div>

        {/* Закладки */}
        <div className="bg-[var(--secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Закладки</span>
          </div>
          <div className="text-xl font-bold text-[var(--foreground)]">{totalBookmarks}</div>
        </div>
      </div>

      {/* Сообщение о статусе подтверждения email */}
      {/* <div className="mt-4 flex justify-center">
        {emailVerified ? (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            Почта подтверждена
          </div>
        ) : (
          <button
            onClick={handleSendVerificationEmail}
            className="px-4 py-2 bg-[var(--chart-1)] text-[var(--primary)] rounded-lg hover:bg-[var(--chart-1)]/90 transition-colors text-sm"
          >
            Отправить письмо подтверждения email
          </button>
        )}
      </div> */}
    </div>
  );
}
