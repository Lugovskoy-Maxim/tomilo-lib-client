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
    <div className="glass rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[var(--chart-1)] to-[var(--chart-2)] shadow-lg">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
            Тема оформления
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm">
            Светлая, тёмная или по системе
          </p>
        </div>
      </div>

      <ThemeToggleGroup />
    </div>
  );
}
