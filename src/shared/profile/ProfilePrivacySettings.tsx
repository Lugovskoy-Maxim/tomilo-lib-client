import { UserProfile, UserPrivacy } from "@/types/user";
import { Check, Lock, BarChart3, Trophy, Info, Eye, EyeOff, History, Bookmark } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

interface ProfilePrivacySettingsProps {
  userProfile: UserProfile;
  /** Встроенный вид: без карточки, только контент */
  embedded?: boolean;
}

const VISIBILITY_LABELS: Record<string, string> = {
  public: "Публично",
  friends: "Друзья",
  private: "Приватно",
};

export default function ProfilePrivacySettings({
  userProfile,
  embedded,
}: ProfilePrivacySettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();
  const [showPrivacyTip, setShowPrivacyTip] = useState(false);

  const currentPrivacy = userProfile.privacy || {
    profileVisibility: "public",
    readingHistoryVisibility: "private",
  };

  // Локальное состояние для оптимистичного обновления переключателей
  const [localShowStats, setLocalShowStats] = useState<boolean | null>(null);
  const [localShowAchievements, setLocalShowAchievements] = useState<boolean | null>(null);
  const [localShowReadingHistory, setLocalShowReadingHistory] = useState<boolean | null>(null);
  const [localShowBookmarks, setLocalShowBookmarks] = useState<boolean | null>(null);

  const showStats = localShowStats ?? userProfile.showStats ?? true;
  const showAchievements = localShowAchievements ?? userProfile.showAchievements ?? true;
  const showReadingHistory = localShowReadingHistory ?? userProfile.showReadingHistory ?? true;
  const showBookmarks = localShowBookmarks ?? userProfile.showBookmarks ?? true;

  const handlePrivacySettingChange = async (setting: keyof UserPrivacy, value: string) => {
    if (isLoading) return;
    try {
      await updateProfile({
        privacy: {
          ...currentPrivacy,
          [setting]: value,
        },
      }).unwrap();
      toast.success("Настройки приватности обновлены");
    } catch (error) {
      console.error("Ошибка при сохранении настроек приватности:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  const handleToggleSetting = async (
    setting: "showStats" | "showAchievements" | "showReadingHistory" | "showBookmarks",
    value: boolean,
  ) => {
    if (isLoading) return;

    // Оптимистичное обновление — сразу меняем UI
    const setters = {
      showStats: setLocalShowStats,
      showAchievements: setLocalShowAchievements,
      showReadingHistory: setLocalShowReadingHistory,
      showBookmarks: setLocalShowBookmarks,
    };
    setters[setting](value);

    try {
      await updateProfile({
        [setting]: value,
      }).unwrap();
      toast.success("Настройки обновлены");
    } catch (error) {
      // Откат при ошибке
      setters[setting](null);
      console.error("Ошибка при сохранении настроек:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  const options: { value: "public" | "friends" | "private"; label: string }[] = [
    { value: "public", label: VISIBILITY_LABELS.public },
    { value: "friends", label: VISIBILITY_LABELS.friends },
    { value: "private", label: VISIBILITY_LABELS.private },
  ];

  const content = (
    <>
      {/* Подсказка о приватности */}
      {showPrivacyTip && (
        <div className="mb-5 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/20 shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                Что видят другие пользователи
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <Eye className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground)]">Всегда видно:</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Имя, аватар, роль, уровень, ранг, дата регистрации, описание (био), любимый
                      жанр, контакты (Telegram, Discord, VK)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground)]">Всегда скрыто:</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Баланс монет, email, дата последнего входа, привязанные соцсети (Яндекс, VK
                      ID)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-[var(--foreground)]">
                      Настраивается отдельно:
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Статистика, достижения, история чтения и закладки — включите или отключите
                      показ каждого раздела ниже.
                    </p>
                    <p className="text-xs text-amber-500/90 mt-1">
                      При скрытии статистики вы также исключаетесь из таблицы лидеров.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <span className="text-sm font-semibold text-[var(--foreground)] block mb-2">
            Видимость профиля
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Кто может просматривать вашу страницу
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePrivacySettingChange("profileVisibility", option.value)}
                disabled={isLoading}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-all ${
                  currentPrivacy.profileVisibility === option.value
                    ? "bg-[var(--chart-1)] border-[var(--chart-1)] text-white shadow-md"
                    : "bg-transparent border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {option.label}
                {currentPrivacy.profileVisibility === option.value && (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Дополнительные настройки отображения */}
        <div className="pt-4 border-t border-[var(--border)]/50">
          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-3 px-1">
            Показывать на публичной странице профиля
          </p>

          {/* Статистика */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--foreground)] block">
                  Статистика
                </span>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Время чтения, главы, закладки, таблица лидеров
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting("showStats", !showStats)}
              disabled={isLoading}
              className={`relative w-11 h-6 rounded-full transition-all ${
                showStats
                  ? "bg-[var(--chart-2)]"
                  : "bg-[var(--secondary)] border border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  showStats ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Достижения */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--foreground)] block">
                  Достижения
                </span>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Прогресс и разблокированные достижения
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting("showAchievements", !showAchievements)}
              disabled={isLoading}
              className={`relative w-11 h-6 rounded-full transition-all ${
                showAchievements
                  ? "bg-[var(--chart-2)]"
                  : "bg-[var(--secondary)] border border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  showAchievements ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* История чтения */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <History className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--foreground)] block">
                  История чтения
                </span>
                <p className="text-xs text-[var(--muted-foreground)]">Что вы читаете и читали</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting("showReadingHistory", !showReadingHistory)}
              disabled={isLoading}
              className={`relative w-11 h-6 rounded-full transition-all ${
                showReadingHistory
                  ? "bg-[var(--chart-2)]"
                  : "bg-[var(--secondary)] border border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  showReadingHistory ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Закладки */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-green-500/20">
                <Bookmark className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <span className="text-sm font-medium text-[var(--foreground)] block">Закладки</span>
                <p className="text-xs text-[var(--muted-foreground)]">Ваши закладки и избранное</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting("showBookmarks", !showBookmarks)}
              disabled={isLoading}
              className={`relative w-11 h-6 rounded-full transition-all ${
                showBookmarks
                  ? "bg-[var(--chart-2)]"
                  : "bg-[var(--secondary)] border border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  showBookmarks ? "left-[calc(100%-1.375rem)]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
            <Lock className="w-5 h-5 text-[var(--chart-1)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Приватность</h2>
            <p className="text-[var(--muted-foreground)] text-xs">
              Кто может видеть ваш профиль и историю
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPrivacyTip(!showPrivacyTip)}
          className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          title="Подробнее о приватности"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      {content}
    </div>
  );
}
