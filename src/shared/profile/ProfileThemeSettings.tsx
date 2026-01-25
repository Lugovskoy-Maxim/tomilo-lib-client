import { UserDisplaySettings } from "@/types/user";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/hooks/useToast";

interface ProfileThemeSettingsProps {
  displaySettings: UserDisplaySettings;
  isLoading?: boolean;
}

export default function ProfileThemeSettings({
  displaySettings,
  isLoading,
}: ProfileThemeSettingsProps) {
  const [updateProfile] = useUpdateProfileMutation();
  const toast = useToast();

  const themes: { value: "light" | "dark" | "system"; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Светлая" },
    { value: "dark", icon: Moon, label: "Тёмная" },
    { value: "system", icon: Monitor, label: "Системная" },
  ];

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    try {
      await updateProfile({
        displaySettings: {
          ...displaySettings,
          theme,
        },
      }).unwrap();
      toast.success("Тема обновлена");
    } catch (error) {
      console.error("Ошибка при сохранении темы:", error);
      toast.error("Не удалось сохранить тему");
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
      <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-3 sm:mb-4">
        Тема
      </h2>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleThemeChange(value)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${
              displaySettings.theme === value
                ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--accent)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{label}</span>
            {displaySettings.theme === value && <Check className="w-3 h-3 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
