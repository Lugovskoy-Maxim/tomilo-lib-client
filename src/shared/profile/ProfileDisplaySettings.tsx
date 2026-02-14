import { UserProfile, UserDisplaySettings } from "@/types/user";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";
import ProfileThemeSettings from "./ProfileThemeSettings";
import { Monitor, Sparkles } from "lucide-react";

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
    <div className="space-y-4 sm:space-y-5">
      <ProfileThemeSettings displaySettings={displaySettings} isLoading={isLoading} />

      <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
            <Monitor className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Контент
            </h2>
            <p className="text-[var(--muted-foreground)] text-xs">
              Отображение тайтлов 18+
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-4 h-4 text-[var(--chart-2)] flex-shrink-0" />
            <div>
              <span className="text-sm font-semibold text-[var(--foreground)] block">
                18+ контент
              </span>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Показывать тайтлы с пометкой 18+
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdultToggle}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              displaySettings.isAdult ? "bg-[var(--primary)]" : "bg-[var(--muted)]"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                displaySettings.isAdult ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
