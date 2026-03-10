import { UserProfile, NotificationPreferences } from "@/types/user";
import { Bell, HelpCircle } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import Tooltip from "@/shared/ui/Tooltip";
import { PushSubscribeButton } from "./PushSubscribeButton";

interface ProfileNotificationsSettingsProps {
  userProfile: UserProfile;
  /** Встроенный вид: без карточки, только контент (тема задаётся снаружи) */
  embedded?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  newChapters: true,
  comments: true,
  recommendations: true,
  news: true,
};

export default function ProfileNotificationsSettings({
  userProfile,
  embedded,
}: ProfileNotificationsSettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const prefs: NotificationPreferences =
    userProfile.notificationPreferences ?? DEFAULT_NOTIFICATIONS;

  const handleChange = async (key: keyof NotificationPreferences, enabled: boolean) => {
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

  const content = (
    <div className="flex flex-col gap-0">
        {/* Строка: Новые главы */}
        <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5 min-h-[56px] border-b border-[var(--border)]/60 last:border-b-0">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-[var(--foreground)] block">
              Новые главы
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Выход новых глав в избранном
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 min-w-[2.75rem] flex-shrink-0">
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

        {/* Строка: Новости */}
        <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5 min-h-[56px] border-b border-[var(--border)]/60 last:border-b-0">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold text-[var(--foreground)] block">
              Новости
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Объявления и новости платформы
            </p>
          </div>
          <div className="relative inline-flex h-6 w-11 min-w-[2.75rem] flex-shrink-0">
            <input
              type="checkbox"
              id="news"
              className="sr-only peer"
              checked={prefs.news}
              onChange={e => handleChange("news", e.target.checked)}
              disabled={isLoading}
            />
            <label
              htmlFor="news"
              className={`block h-full w-full cursor-pointer rounded-full border transition-colors ${
                prefs.news
                  ? "bg-[var(--primary)] border-[var(--primary)]"
                  : "bg-[var(--muted)] border-[var(--border)]"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  prefs.news ? "left-5" : "left-0.5"
                }`}
              />
            </label>
          </div>
        </div>

        {/* Строка: Push в браузере — тот же формат строки, что и «Новые главы» */}
        <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5 min-h-[56px] border-b border-[var(--border)]/60 last:border-b-0">
          <PushSubscribeButton embedded />
        </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60 shrink-0">
            <Bell className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--foreground)]">Уведомления</h2>
            <p className="text-[var(--muted-foreground)] text-xs truncate">
              Настройте, о чём получать уведомления
            </p>
          </div>
        </div>
        <Tooltip
          content={
            <div className="space-y-2 max-w-[280px]">
              <p className="font-medium">О уведомлениях</p>
              <p>Управляйте тем, какие уведомления вы хотите получать:</p>
              <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
                <li>
                  <strong>Новые главы</strong> — уведомления о выходе глав в тайтлах из ваших
                  закладок
                </li>
                <li>
                  <strong>Новости</strong> — объявления и новости платформы (push и в приложении)
                </li>
              </ul>
              <p className="text-[var(--muted-foreground)] text-[10px]">
                Системные уведомления о безопасности отключить нельзя.
              </p>
            </div>
          }
          position="left"
          trigger="click"
        >
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      {content}
    </div>
  );
}
