import { UserProfile } from "@/types/user";
import { Bell } from "lucide-react";

interface ProfileNotificationsSettingsProps {
  userProfile: UserProfile;
}

export default function ProfileNotificationsSettings({}: ProfileNotificationsSettingsProps) {
  const handleNotificationChange = (type: string, enabled: boolean) => {
    console.log(`Изменение настройки уведомлений ${type}: ${enabled}`);
  };

  return (
    <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--chart-1)] shadow-lg">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
            Уведомления
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Настройте, о чём получать уведомления
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50">
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)] block">
              Новые главы
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Уведомления о выходе новых глав в избранном
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 flex-shrink-0">
            <input
              type="checkbox"
              id="new-chapters"
              className="sr-only peer"
              defaultChecked={true}
              onChange={e => handleNotificationChange("newChapters", e.target.checked)}
            />
            <label
              htmlFor="new-chapters"
              className="block h-full w-full cursor-pointer rounded-full bg-[var(--muted)] border border-[var(--border)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
            >
              <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--background)]/50 border border-[var(--border)]/50">
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)] block">
              Комментарии
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Уведомления об ответах и упоминаниях
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 flex-shrink-0">
            <input
              type="checkbox"
              id="comments"
              className="sr-only peer"
              defaultChecked={true}
              onChange={e => handleNotificationChange("comments", e.target.checked)}
            />
            <label
              htmlFor="comments"
              className="block h-full w-full cursor-pointer rounded-full bg-[var(--muted)] border border-[var(--border)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-colors"
            >
              <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
