"use client";
import { UserProfile } from "@/types/user";
import { BookOpen, Clock, Star, CircleDollarSign, HelpCircle } from "lucide-react";
import { getRankColor, getRankDisplay, levelToRank, RANK_NAMES } from "@/lib/rank-utils";
import { useState } from "react";

interface ProfileStatsProps {
  userProfile: UserProfile;
}

export default function ProfileStats({ userProfile }: ProfileStatsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 py-4">
        {/* Опыт */}
        <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Опыт</span>
          </div>
          <div className="text-lg font-bold text-[var(--foreground)]">{experience}</div>
        </div>

        {/* Баланс */}
        <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <CircleDollarSign className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Баланс</span>
          </div>
          <div className="text-lg font-bold text-[var(--foreground)]">{balance}</div>
        </div>

        {/* Прочитанные главы */}
        <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Глав</span>
          </div>
          <div className="text-lg font-bold text-[var(--foreground)]">{totalChaptersRead}</div>
        </div>

        {/* Время чтения */}
        <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Время</span>
          </div>
          <div className="text-lg font-bold text-[var(--foreground)]">
            {formatReadingTime(totalChaptersRead)}
          </div>
        </div>

        {/* Закладки */}
        <div className="bg-[var(--secondary)] rounded-xl p-2 border border-[var(--border)] hover:border-[var(--primary)] transition-colors flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Закладки</span>
          </div>
          <div className="text-lg font-bold text-[var(--foreground)]">{totalBookmarks}</div>
        </div>
      </div>

      {/* Отображение ранга силы с подсказкой */}
      <div className="mt-4 p-3 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">Ранг силы</div>
          <button
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            onClick={() => setIsModalOpen(true)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center mt-2">
          <div
            className="text-lg font-bold"
            style={{ color: getRankColor(levelToRank(level).rank) }}
          >
            {getRankDisplay(level)}
          </div>
          {/* <div className="ml-2 text-sm text-[var(--muted-foreground)]">
            {levelToRank(level).stars} {levelToRank(level).stars === 1 ? 'звезда' : levelToRank(level).stars < 5 ? 'звезды' : 'звёзд'}
          </div> */}
        </div>
      </div>

      {/* Модальное окно с рангами */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-[var(--background)]/90 flex items-center justify-center z-50 p-4"
          onClick={e => {
            // Закрываем модальное окно при клике вне его
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-[var(--background)] rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Система рангов</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 9 }, (_, i) => {
                const rankNum = 9 - i;
                const minLevel = (rankNum - 1) * 10;
                const maxLevel = rankNum === 9 ? 90 : rankNum * 10;
                const isCurrent = level >= minLevel && level <= maxLevel;
                const currentStars = levelToRank(level).stars;

                return (
                  <div
                    key={rankNum}
                    className={`p-3 rounded-lg ${
                      isCurrent ? "bg-[var(--primary)]/10" : "bg-[var(--secondary)]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-sm" style={{ color: getRankColor(rankNum) }}>
                        {RANK_NAMES[rankNum]} {rankNum}
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-[var(--primary)] text-[var(--primary-foreground)] px-2 py-1 rounded">
                          Текущий ({currentStars}{" "}
                          {currentStars === 1 ? "звезда" : currentStars < 5 ? "звезды" : "звёзд"})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Уровни: {minLevel} - {maxLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
