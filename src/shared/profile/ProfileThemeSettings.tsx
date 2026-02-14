import { UserDisplaySettings } from "@/types/user";
import ThemeToggleGroup from "@/shared/theme-toggle/ThemeToggleGroup";
import { Palette } from "lucide-react";

interface ProfileThemeSettingsProps {
  displaySettings: UserDisplaySettings;
  isLoading?: boolean;
}

export default function ProfileThemeSettings({
  isLoading,
}: ProfileThemeSettingsProps) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 min-[360px]:p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]/60">
          <Palette className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            Тема оформления
          </h2>
          <p className="text-[var(--muted-foreground)] text-xs">
            Светлая, тёмная или по системе
          </p>
        </div>
      </div>

      <ThemeToggleGroup />
    </div>
  );
}
