import { UserDisplaySettings } from "@/types/user";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";

interface ProfileThemeSettingsProps {
  displaySettings: UserDisplaySettings;
  isLoading?: boolean;
}

export default function ProfileThemeSettings({
  isLoading,
}: ProfileThemeSettingsProps) {
  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 sm:p-4">
      <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-3 sm:mb-4">
        Тема
      </h2>

      <ThemeToggleGroup />
    </div>
  );
}
