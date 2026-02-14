import { UserProfile, NotificationPreferences } from "@/types/user";
import { Bell } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfileNotificationsSettingsProps {
  userProfile: UserProfile;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newChapters: true,
  comments: true,
  recommendations: true,
};

export default function ProfileNotificationsSettings({
  userProfile,
}: ProfileNotificationsSettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const prefs: NotificationPreferences =
    userProfile.notificationPreferences ?? DEFAULT_NOTIFICATIONS;

  const handleChange = async (
    key: keyof NotificationPreferences,
    enabled: boolean,
  ) => {
    if (isLoading) return;
    try {
      await updateProfile({
        notificationPreferences: {
          ...prefs,
          [key]: enabled,
        },
      }).unwrap();
      toast.success("Настройки уведомлений сохранены");
    } catch (error) {
      console.error("Ошибка при сохранении уведомлений:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Bell className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Уведомления
          </h2>
          <p className="text-[var(--muted-foreground)] text-xs">
            Настройте, о чём получать уведомления
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
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
              checked={prefs.newChapters}
              onChange={e => handleChange("newChapters", e.target.checked)}
              disabled={isLoading}
            />
            <label
              htmlFor="new-chapters"
              className={`block h-full w-full cursor-pointer rounded-full border transition-colors ${
                prefs.newChapters
                  ? "bg-[var(--primary)] border-[var(--primary)]"
                  : "bg-[var(--muted)] border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.newChapters ? "left-5" : "left-0.5"
                }`}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
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
              checked={prefs.comments}
              onChange={e => handleChange("comments", e.target.checked)}
              disabled={isLoading}
            />
            <label
              htmlFor="comments"
              className={`block h-full w-full cursor-pointer rounded-full border transition-colors ${
                prefs.comments
                  ? "bg-[var(--primary)] border-[var(--primary)]"
                  : "bg-[var(--muted)] border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.comments ? "left-5" : "left-0.5"
                }`}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <div>
            <span className="text-sm font-semibold text-[var(--foreground)] block">
              Рекомендации
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Уведомления о подобных тайтлах и персональные подборки
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 flex-shrink-0">
            <input
              type="checkbox"
              id="recommendations"
              className="sr-only peer"
              checked={prefs.recommendations}
              onChange={e => handleChange("recommendations", e.target.checked)}
              disabled={isLoading}
            />
            <label
              htmlFor="recommendations"
              className={`block h-full w-full cursor-pointer rounded-full border transition-colors ${
                prefs.recommendations
                  ? "bg-[var(--primary)] border-[var(--primary)]"
                  : "bg-[var(--muted)] border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.recommendations ? "left-5" : "left-0.5"
                }`}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
