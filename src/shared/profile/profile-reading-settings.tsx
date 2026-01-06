import { UserProfile } from "@/types/user";
import { Eye } from "lucide-react";

interface ProfileReadingSettingsProps {
  userProfile: UserProfile;
}

export default function ProfileReadingSettings({ userProfile }: ProfileReadingSettingsProps) {
  // TODO: Реализовать логику сохранения настроек чтения
  const handleReadingSettingChange = (setting: string, value: string | boolean) => {
    console.log(`Изменение настройки чтения ${setting}: ${value}`);
    // Здесь будет логика сохранения настроек чтения
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">
          Чтение
        </h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            Тип отображения
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Как отображать страницы при чтении
          </p>
          <div className="flex gap-2">
            <button 
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => handleReadingSettingChange("displayMode", "single")}
            >
              По одной странице
            </button>
            <button 
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => handleReadingSettingChange("displayMode", "continuous")}
            >
              Непрерывная прокрутка
            </button>
          </div>
        </div>
        
        <div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            Ориентация экрана
          </span>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Предпочтительная ориентация при чтении
          </p>
          <div className="flex gap-2">
            <button 
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => handleReadingSettingChange("orientation", "auto")}
            >
              Автоматически
            </button>
            <button 
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => handleReadingSettingChange("orientation", "portrait")}
            >
              Портретная
            </button>
            <button 
              className="flex-1 py-2 px-3 bg-[var(--accent)] border border-[var(--border)] rounded-lg hover:bg-[var(--accent)]/80 transition-colors text-sm"
              onClick={() => handleReadingSettingChange("orientation", "landscape")}
            >
              Альбомная
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}