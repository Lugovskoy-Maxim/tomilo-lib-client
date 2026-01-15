import { UserProfile } from "@/types/user";
import { Bell } from "lucide-react";

interface ProfileNotificationsSettingsProps {
  userProfile: UserProfile;
}

export default function ProfileNotificationsSettings({}: ProfileNotificationsSettingsProps) {
  // TODO: Реализовать логику сохранения настроек уведомлений
  const handleNotificationChange = (type: string, enabled: boolean) => {
    console.log(`Изменение настройки уведомлений ${type}: ${enabled}`);
    // Здесь будет логика сохранения настроек уведомлений
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-lg font-semibold text-[var(--muted-foreground)]">Уведомления</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-[var(--foreground)]">Новые главы</span>
            <p className="text-xs text-[var(--muted-foreground)]">Уведомления о новых главах</p>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input
              type="checkbox"
              id="new-chapters"
              className="sr-only peer"
              defaultChecked={true} // TODO: Получать значение из userProfile
              onChange={e => handleNotificationChange("newChapters", e.target.checked)}
            />
            <label
              htmlFor="new-chapters"
              className="block w-full h-full bg-[var(--muted)] border border-[var(--border)] rounded-full cursor-pointer peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
            >
              <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-[var(--border)] rounded-full transition-transform peer-checked:translate-x-5"></span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-[var(--foreground)]">Комментарии</span>
            <p className="text-xs text-[var(--muted-foreground)]">Уведомления о комментариях</p>
          </div>
          <div className="relative inline-block w-10 h-5">
            <input
              type="checkbox"
              id="comments"
              className="sr-only peer"
              defaultChecked={true} // TODO: Получать значение из userProfile
              onChange={e => handleNotificationChange("comments", e.target.checked)}
            />
            <label
              htmlFor="comments"
              className="block w-full h-full bg-[var(--muted)] border border-[var(--border)] rounded-full cursor-pointer peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
            >
              <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white border border-[var(--border)] rounded-full transition-transform peer-checked:translate-x-5"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
