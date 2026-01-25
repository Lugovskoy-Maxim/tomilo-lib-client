import { UserProfile, UserDisplaySettings } from "@/types/user";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import ProfileThemeSettings from "./ProfileThemeSettings";

interface ProfileDisplaySettingsProps {
  userProfile: UserProfile;
}

export default function ProfileDisplaySettings({ userProfile }: ProfileDisplaySettingsProps) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  const displaySettings: UserDisplaySettings = userProfile.displaySettings || {
    isAdult: false,
    theme: "system",
  };

  const handleAdultToggle = async () => {
    if (isLoading) return;
    try {
      await updateProfile({
        displaySettings: {
          ...displaySettings,
          isAdult: !displaySettings.isAdult,
        },
      }).unwrap();
      toast.success(
        !displaySettings.isAdult ? "Контент для взрослых включен" : "Контент для взрослых выключен",
      );
    } catch (error) {
      console.error("Ошибка при сохранении настроек:", error);
      toast.error("Не удалось сохранить настройки");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Тема */}
      <ProfileThemeSettings displaySettings={displaySettings} isLoading={isLoading} />

      {/* 18+ контент */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-3 sm:mb-4">
          Контент
        </h2>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] block">
              18+ контент
            </span>
            <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate block">
              Показывать тайтлы 18+
            </span>
          </div>
          <button
            type="button"
            onClick={handleAdultToggle}
            disabled={isLoading}
            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
              displaySettings.isAdult ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                displaySettings.isAdult ? "translate-x-4.5 sm:translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
