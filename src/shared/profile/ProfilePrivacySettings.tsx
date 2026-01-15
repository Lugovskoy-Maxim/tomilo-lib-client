import { UserProfile } from "@/types/user";
import { Users, Eye, Lock } from "lucide-react";

interface ProfilePrivacySettingsProps {
  userProfile: UserProfile;
}

export default function ProfilePrivacySettings({}: ProfilePrivacySettingsProps) {
  // TODO: Реализовать логику сохранения настроек приватности
  const handlePrivacySettingChange = (setting: string, value: string) => {
    console.log(`Изменение настройки приватности ${setting}: ${value}`);
    // Здесь будет логика сохранения настроек приватности
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Приватность</h2>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">Видимость профиля</span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Кто может видеть ваш профиль
          </p>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("profileVisibility", "public")}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Публичный
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Все пользователи</div>
            </button>
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("profileVisibility", "friends")}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Для друзей
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Только друзья</div>
            </button>
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("profileVisibility", "private")}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Приватный
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Только вы</div>
            </button>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">История чтения</span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Кто может видеть вашу историю чтения
          </p>
          <div className="flex flex-col gap-2">
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("readingHistoryVisibility", "public")}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Публичная
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Все пользователи</div>
            </button>
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("readingHistoryVisibility", "friends")}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Для друзей
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Только друзья</div>
            </button>
            <button
              className="flex items-center gap-2 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm justify-between"
              onClick={() => handlePrivacySettingChange("readingHistoryVisibility", "private")}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Приватная
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Только вы</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
